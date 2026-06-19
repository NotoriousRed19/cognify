import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notificationService } from "@/lib/notification-service";

// Zona horaria del sistema (Venezuela UTC-4). Centralizado aquí para facilitar 
// futuros cambios si se agregan doctores en otros países.
const SYSTEM_TIMEZONE_OFFSET_HOURS = -4;

/**
 * Manejador de la petición GET para el Cron Job que envía recordatorios de citas.
 * 
 * Propósito:
 * Ejecutarse automáticamente de forma diaria (configurado vía un servicio externo)
 * para encontrar todas las citas del día siguiente y enviar recordatorios por correo a los pacientes,
 * respetando las preferencias de notificación de cada doctor.
 * 
 * Flujo de ejecución:
 * 1. Verifica la autorización mediante el header `Authorization: Bearer CRON_SECRET`.
 * 2. Calcula el rango de tiempo (inicio y fin de "mañana") usando la zona horaria del sistema (UTC-4).
 * 3. Consulta MASIVA: Obtiene todas las citas con estado "CONFIRMED" agendadas para mañana.
 * 4. Consulta en paralelo y construye diccionarios (Maps) para:
 *    - Preferencias de notificación del doctor (`NotificationPreference`).
 *    - Datos del doctor (`User`).
 *    - Historial de notificaciones para evitar envíos duplicados (`Notification`).
 * 5. Filtra las citas asegurándose de que:
 *    - El doctor tenga habilitados los recordatorios (`reminder_24h`).
 *    - El correo no se haya enviado ya (`Already sent`).
 *    - El paciente tenga un correo electrónico registrado.
 * 6. Ejecuta el envío de correos concurrentemente en lotes (ej. de a 10) usando `notificationService`.
 * 
 * @param {Request} request - Petición HTTP que requiere autenticación mediante secreto cron.
 * @returns {Promise<Response>} Resumen de ejecución con métricas (procesados, enviados, fallidos).
 */
export async function GET(request) {
  // Verificación de seguridad para el cron job
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Calcular "mañana" en la zona horaria del sistema (no UTC del servidor)
    const now = new Date();
    const localNow = new Date(now.getTime() + (SYSTEM_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000));
    
    const tomorrowLocal = new Date(localNow);
    tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);
    
    // Inicio y fin de mañana en UTC (para la query a la BD)
    const startOfTomorrowLocal = new Date(tomorrowLocal);
    startOfTomorrowLocal.setHours(0, 0, 0, 0);
    const startOfTomorrowUtc = new Date(startOfTomorrowLocal.getTime() - (SYSTEM_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000));
    
    const endOfTomorrowLocal = new Date(tomorrowLocal);
    endOfTomorrowLocal.setHours(23, 59, 59, 999);
    const endOfTomorrowUtc = new Date(endOfTomorrowLocal.getTime() - (SYSTEM_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000));

    // === CONSULTA MASIVA (resuelve el problema N+1) ===
    // Traer todas las citas de mañana CON los datos del doctor en un solo SELECT
    const { data: appointments, error: apptError } = await supabaseAdmin
      .from("Appointment")
      .select(`
        id, 
        fecha_inicio, 
        guest_name, 
        guest_details, 
        doctor_id
      `)
      .eq("status", "CONFIRMED")
      .gte("fecha_inicio", startOfTomorrowUtc.toISOString())
      .lte("fecha_inicio", endOfTomorrowUtc.toISOString());

    if (apptError) throw apptError;

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: "No hay citas para enviar recordatorios.", processed: 0 });
    }

    // Recopilar todos los doctor_ids únicos
    const doctorIds = [...new Set(appointments.map(a => a.doctor_id))];

    // Traer TODAS las preferencias de estos doctores en UNA sola consulta
    const { data: allPrefs } = await supabaseAdmin
      .from("NotificationPreference")
      .select("doctor_id, reminder_24h, custom_reminder_message")
      .in("doctor_id", doctorIds);

    // Traer TODOS los nombres de doctores en una sola consulta
    const { data: allDoctors } = await supabaseAdmin
      .from("User")
      .select("id, name")
      .in("id", doctorIds);

    // Traer TODOS los logs de recordatorios ya enviados para estas citas
    const appointmentIds = appointments.map(a => a.id);
    const { data: existingLogs } = await supabaseAdmin
      .from("Notification")
      .select("appointment_id")
      .in("appointment_id", appointmentIds)
      .eq("event_type", "REMINDER_24H")
      .eq("status", "SENT");

    // Crear mapas para acceso O(1)
    const prefsMap = new Map((allPrefs || []).map(p => [p.doctor_id, p]));
    const doctorMap = new Map((allDoctors || []).map(d => [d.id, d]));
    const sentSet = new Set((existingLogs || []).map(l => l.appointment_id));

    // === ENVÍO EN LOTES CONCURRENTES ===
    const BATCH_SIZE = 10;
    const results = [];

    // Filtrar primero qué citas necesitan recordatorio
    const toSend = appointments.filter(appt => {
      const prefs = prefsMap.get(appt.doctor_id);
      const shouldSend = prefs ? prefs.reminder_24h : true; // Default: activado

      if (!shouldSend) {
        results.push({ appointmentId: appt.id, status: 'SKIPPED', reason: 'Doctor disabled' });
        return false;
      }
      if (sentSet.has(appt.id)) {
        results.push({ appointmentId: appt.id, status: 'SKIPPED', reason: 'Already sent' });
        return false;
      }
      const email = appt.guest_details?.email;
      if (!email) {
        results.push({ appointmentId: appt.id, status: 'SKIPPED', reason: 'No email' });
        return false;
      }
      return true;
    });

    // Procesar en lotes de BATCH_SIZE
    for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
      const batch = toSend.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (appt) => {
        const prefs = prefsMap.get(appt.doctor_id);
        const doctor = doctorMap.get(appt.doctor_id);
        const email = appt.guest_details.email;

        try {
          const result = await notificationService.sendReminder({
            doctorId: appt.doctor_id,
            appointmentId: appt.id,
            patientEmail: email,
            patientName: appt.guest_name,
            doctorName: doctor?.name || "Especialista",
            appointmentDate: appt.fecha_inicio,
            customMessage: prefs?.custom_reminder_message || null
          });

          return { 
            appointmentId: appt.id, 
            status: result.success ? 'SENT' : 'FAILED',
            error: result.error 
          };
        } catch (err) {
          return { appointmentId: appt.id, status: 'FAILED', error: err.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      sent: results.filter(r => r.status === 'SENT').length,
      skipped: results.filter(r => r.status === 'SKIPPED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      results 
    });

  } catch (error) {
    console.error("[CRON REMINDERS ERROR]", error);
    return NextResponse.json({ error: "Error procesando recordatorios" }, { status: 500 });
  }
}

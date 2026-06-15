import { createClient } from '@supabase/supabase-js';
import { notificationService } from '@/lib/notification-service';
import { startOfDay, endOfDay, addDays } from 'date-fns';

// Inicializar cliente de Supabase con la llave de administrador
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // 1. Protección del Cron (Vercel enviará un Bearer Token secreto)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('No autorizado', { status: 401 });
    }

    console.log('[CRON] Iniciando envío de recordatorios...');

    // 2. Calcular el rango de fechas de MAÑANA
    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = startOfDay(tomorrow).toISOString();
    const endOfTomorrow = endOfDay(tomorrow).toISOString();

    // 3. Buscar todas las citas confirmadas de mañana que no tengan recordatorio enviado
    const { data: appointments, error } = await supabaseAdmin
      .from('Appointment')
      .select('id, guest_name, guest_details, doctor_id, start_time')
      .eq('status', 'CONFIRMED')
      .eq('reminder_sent', false)
      .gte('start_time', startOfTomorrow)
      .lte('start_time', endOfTomorrow);

    if (error) {
      console.error('[CRON] Error buscando citas:', error);
      return new Response(JSON.stringify({ error: 'Fallo al buscar citas' }), { status: 500 });
    }

    let sentCount = 0;

    // 4. Enviar los correos uno por uno
    for (const appt of appointments) {
      // Extraer nombre del psicólogo
      const { data: docData } = await supabaseAdmin
        .from('Users')
        .select('name')
        .eq('id', appt.doctor_id)
        .single();
        
      const doctorName = docData?.name || 'su Psicólogo';
      const patientEmail = appt.guest_details?.email;

      if (patientEmail) {
        await notificationService.sendReminder({
          doctorId: appt.doctor_id,
          appointmentId: appt.id,
          patientEmail: patientEmail,
          patientName: appt.guest_name,
          doctorName: doctorName,
          appointmentDate: appt.start_time
        });
        
        sentCount++;
      }

      // Marcar la cita como "Recordatorio Enviado" para que nunca se duplique
      await supabaseAdmin
        .from('Appointment')
        .update({ reminder_sent: true })
        .eq('id', appt.id);
    }

    console.log(`[CRON] Recordatorios enviados con éxito: ${sentCount}`);
    return new Response(JSON.stringify({ success: true, sentCount }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    console.error('[CRON] Excepción:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

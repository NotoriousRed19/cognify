import { NextResponse } from "next/server";
import { requireAuth, requireActiveSubscription } from "@/lib/auth-guard";
import { z } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CreateAppointmentSchema = z.object({
  titulo: z.string().min(1, "Falta el título").max(255),
  fecha_inicio: z.string().datetime("La fecha de inicio debe ser ISO 8601"),
  fecha_fin: z.string().datetime("La fecha de fin debe ser ISO 8601"),
  patient_id: z.string().regex(UUID_REGEX, "patient_id inválido").nullable().optional()
}).refine(data => {
  const start = new Date(data.fecha_inicio);
  const end = new Date(data.fecha_fin);
  return end > start;
}, {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["fecha_fin"]
});

/**
 * Manejador de la petición GET para la ruta API de citas (Appointments).
 * 
 * Propósito:
 * Consultar las citas agendadas por el profesional de la salud autenticado.
 * 
 * Flujo de ejecución:
 * 1. Verifica que el usuario esté autenticado (`requireAuth`).
 * 2. Filtra citas excluyendo aquellas con estado "CANCELADA" o "REJECTED".
 * 3. Si se incluyen parámetros `start_date` y `end_date`, acota la búsqueda al rango; 
 *    si no, impone un límite de seguridad de 500 registros.
 * 
 * @param {Request} request - Objeto de la petición con parámetros opcionales de consulta.
 * @returns {Promise<Response>} Respuesta JSON con las citas encontradas o un mensaje de error.
 */
export async function GET(request) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("Appointment")
      .select(`
        *,
        patient:Patient ( nombre )
      `)
      .neq("estado", "CANCELADA")
      .neq("status", "REJECTED")
      .order("fecha_inicio", { ascending: true });

    if (startDate) {
      query = query.gte("fecha_inicio", startDate);
    }
    if (endDate) {
      query = query.lte("fecha_inicio", endDate);
    }
    
    // Si no mandan fechas, limitamos a 500 por seguridad (paginación básica preventiva)
    if (!startDate && !endDate) {
      query = query.limit(500);
    }

    const { data: appointments, error } = await query;

    if (error) throw error;

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error("[APPOINTMENTS_GET]", error);
    return NextResponse.json(
      { error: "Error interno al obtener la agenda" },
      { status: 500 }
    );
  }
}

/**
 * Manejador de la petición POST para crear una nueva cita médica.
 * 
 * Propósito:
 * Agendar una nueva cita verificando estrictamente la disponibilidad del horario.
 * 
 * Flujo de ejecución:
 * 1. Verifica autenticación y suscripción activa (`requireActiveSubscription`).
 * 2. Valida el esquema de datos entrante usando Zod.
 * 3. Si se asocia un paciente (`patient_id`), comprueba que pertenezca al doctor actual.
 * 4. Busca colisiones de horario (overlapping) en citas no canceladas.
 * 5. Inserta la cita si el bloque de tiempo está disponible.
 * 
 * @param {Request} request - Objeto de la petición conteniendo los datos de la nueva cita.
 * @returns {Promise<Response>} Respuesta JSON con la cita creada o los errores de validación/conflicto.
 */
export async function POST(request) {
  try {
    const { user, supabase, errorResponse } = await requireActiveSubscription();
    if (errorResponse) return errorResponse;

    const rawBody = await request.json();
    const parsed = CreateAppointmentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
    }

    const { titulo, fecha_inicio, fecha_fin, patient_id } = parsed.data;

    // Verificar que el paciente pertenece al doctor
    if (patient_id) {
      const { data: patient } = await supabase
        .from("Patient")
        .select("id")
        .eq("id", patient_id)
        .eq("doctor_id", user.id)
        .single();

      if (!patient) {
        return NextResponse.json({ error: "Paciente inválido o no autorizado" }, { status: 403 });
      }
    }

    // Verificar colisiones de horario (Overlap) para evitar citas dobles
    const { data: overlapping, error: overlapError } = await supabase
      .from("Appointment")
      .select("id, status, estado, expires_at")
      .eq("doctor_id", user.id)
      .neq("estado", "CANCELADA")
      .neq("status", "REJECTED")
      .lt("fecha_inicio", fecha_fin)
      .gt("fecha_fin", fecha_inicio);

    if (overlapError) {
      return NextResponse.json({ error: "Error validando disponibilidad del horario" }, { status: 500 });
    }

    if (overlapping && overlapping.length > 0) {
      const hasConflict = overlapping.some(appt => {
        const s = appt.status || appt.estado;
        if (s === 'CONFIRMED' || s === 'AGENDADA' || s === 'COMPLETADA') return true;
        if (s === 'PENDING_APPROVAL') {
          return !appt.expires_at || new Date(appt.expires_at) > new Date();
        }
        return false;
      });

      if (hasConflict) {
        return NextResponse.json({ error: "Ya tienes una cita o reserva ocupando este bloque de tiempo" }, { status: 409 });
      }
    }

    const { data: newAppointment, error } = await supabase
      .from("Appointment")
      .insert({
        id: crypto.randomUUID(),
        titulo,
        fecha_inicio,
        fecha_fin,
        patient_id: patient_id || null,
        doctor_id: user.id,
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        patient:Patient ( nombre )
      `)
      .single();

    if (error) {
      // Si falla por foreign key (RLS no encuentra al paciente)
      if (error.code === '23503' || error.code === '42501') {
        return NextResponse.json({ error: "Permiso denegado sobre el paciente" }, { status: 403 });
      }
      throw error;
    }

    return NextResponse.json({ appointment: newAppointment }, { status: 201 });
  } catch (error) {
    console.error("[APPOINTMENTS_POST]", error);
    return NextResponse.json(
      { error: "Lógica interna falló al agendar la cita" },
      { status: 500 }
    );
  }
}

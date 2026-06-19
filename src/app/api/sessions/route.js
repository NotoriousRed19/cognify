import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

/**
 * Manejador de la petición POST para registrar una nueva sesión clínica (evolución).
 * 
 * Propósito:
 * Permitir al doctor crear un registro clínico (notas, tareas, observaciones) 
 * asociado a un paciente específico, para llevar su historial de evolución de consultas.
 * 
 * Flujo de ejecución:
 * 1. Verifica la autenticación del usuario (`requireAuth`).
 * 2. Extrae los datos de la sesión desde el cuerpo de la petición.
 * 3. Valida la obligatoriedad del identificador del paciente (`patient_id`).
 * 4. Analiza la `fecha_sesion` si fue proporcionada, de lo contrario asume la fecha y hora actual.
 * 5. Ejecuta la inserción en la tabla `TherapySession`.
 *    (La seguridad RLS provoca un error 403 si el doctor no es dueño del `patient_id`).
 * 6. Retorna el nuevo registro creado.
 * 
 * @param {Request} request - Petición HTTP con los detalles clínicos de la sesión.
 * @returns {Promise<Response>} Respuesta de éxito (201) con el objeto insertado o error.
 */
export async function POST(request) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { patient_id, notas, tareas_pendientes, observaciones, fecha_sesion } = await request.json();

    if (!patient_id) {
      return NextResponse.json({ error: "No se proporcionó el paciente" }, { status: 400 });
    }

    let fechaSesionParsed = new Date().toISOString();
    if (fecha_sesion) {
      const d = new Date(fecha_sesion);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Fecha de sesión inválida" }, { status: 400 });
      fechaSesionParsed = d.toISOString();
    }

    const { data: newSession, error } = await supabase
      .from("TherapySession")
      .insert({
        id: crypto.randomUUID(),
        patient_id,
        notas: notas || null,
        tareas_pendientes: tareas_pendientes || null,
        observaciones: observaciones || null,
        fecha_sesion: fechaSesionParsed,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // El RLS protege la inserción si el usuario no es dueño del patient_id
      return NextResponse.json({ error: "Acceso denegado a este paciente o error al guardar" }, { status: 403 });
    }

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("[SESSIONS_POST]", error);
    return NextResponse.json(
      { error: "Error interno gestionando la sesión" },
      { status: 500 }
    );
  }
}

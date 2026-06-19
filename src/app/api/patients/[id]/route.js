import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Manejador de la petición GET para obtener el expediente detallado de un paciente.
 * 
 * Propósito:
 * Consultar y devolver la información personal del paciente, junto con su historial
 * clínico (sesiones de terapia) y su historial de reservas (citas), para la vista
 * de expediente en el dashboard del doctor.
 * 
 * Flujo de ejecución:
 * 1. Verifica la autenticación y permisos del usuario (`requireAuth`).
 * 2. Valida que el parámetro `id` de la ruta cumpla con el formato UUID.
 * 3. Ejecuta de forma paralela (Promise.all) tres consultas a Supabase:
 *    - Obtener datos demográficos en `Patient`.
 *    - Obtener el historial clínico en `TherapySession` (ordenado cronológicamente).
 *    - Obtener el historial de reservas en `Appointment`.
 *    (La seguridad RLS asegura que el doctor solo recupere lo suyo).
 * 4. Ensambla y retorna un objeto JSON consolidado.
 * 
 * @param {Request} request - Petición HTTP entrante.
 * @param {Object} context - Objeto con el parámetro de la ruta (`id` del paciente).
 * @returns {Promise<Response>} JSON con el objeto `patient` completo o un error 404/500.
 */
export async function GET(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Con Supabase JS, podemos usar select anidado si configuramos las FK correctamente
    // Si la DB tiene relaciones, podemos hacer "*, TherapySession(*), Appointment(*)"
    // Vamos a hacer consultas paralelas ya que RLS protege todo.
    const [patientRes, sessionsRes, appointmentsRes] = await Promise.all([
      supabase.from("Patient").select("*").eq("id", id).single(),
      supabase.from("TherapySession").select("*").eq("patient_id", id).order("fecha_sesion", { ascending: false }),
      supabase.from("Appointment").select("*").eq("patient_id", id).order("fecha_inicio", { ascending: false })
    ]);

    if (patientRes.error) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    const patient = {
      ...patientRes.data,
      sesiones: sessionsRes.data || [],
      appointments: appointmentsRes.data || []
    };

    return NextResponse.json({ patient }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_GET]", error);
    return NextResponse.json(
      { error: "Error de servidor al obtener detalles del paciente" },
      { status: 500 }
    );
  }
}

/**
 * Manejador de la petición PATCH para actualizar datos demográficos de un paciente.
 * 
 * Propósito:
 * Permitir al doctor modificar la información de perfil de un paciente desde su expediente.
 * 
 * Flujo de ejecución:
 * 1. Verifica la autenticación (`requireAuth`) y el formato UUID del `id`.
 * 2. Extrae el JSON de la petición y filtra estrictamente solo los campos permitidos.
 * 3. Si se proporciona `fecha_nacimiento`, valida su validez y la convierte a ISO.
 * 4. Si se intenta cambiar el `email`, verifica que no exista ya otro paciente del mismo 
 *    doctor con ese correo exacto (para evitar duplicidad no deseada).
 * 5. Ejecuta el `update` en la tabla `Patient` y devuelve la fila modificada.
 * 
 * @param {Request} request - Petición con el payload parcial de campos a actualizar.
 * @param {Object} context - Objeto con el parámetro `id`.
 * @returns {Promise<Response>} JSON con el paciente actualizado o error (ej. 409 si correo en uso).
 */
export async function PATCH(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const body = await request.json();

    const allowedFields = ["nombre", "identificacion", "celular", "email", "fecha_nacimiento", "sexo", "nacionalidad", "historial_medico", "medicacion"];
    const data = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === "fecha_nacimiento" && body[field]) {
          const d = new Date(body[field]);
          if (isNaN(d.getTime())) return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });
          data[field] = d.toISOString();
        } else {
          data[field] = body[field] || null;
        }
      }
    }

    if (data.email) {
      const { data: existingPatient } = await supabase
        .from('Patient')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('email', data.email)
        .neq('id', id)
        .limit(1)
        .maybeSingle();

      if (existingPatient) {
        return NextResponse.json({ error: "El correo electrónico ya está registrado para otro paciente." }, { status: 409 });
      }
    }

    const { data: updated, error } = await supabase
      .from("Patient")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ patient: updated }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_PATCH]", error);
    return NextResponse.json(
      { error: "Error al actualizar el paciente" },
      { status: 500 }
    );
  }
}

/**
 * Manejador de la petición DELETE para eliminar un paciente.
 * 
 * Propósito:
 * Borrar de forma permanente a un paciente del listado del doctor.
 * (La base de datos se encarga de eliminar en cascada citas y sesiones asociadas).
 * 
 * Flujo de ejecución:
 * 1. Autentica al usuario.
 * 2. Valida el UUID del parámetro.
 * 3. Ejecuta el borrado. RLS garantiza que el doctor solo borra pacientes propios.
 * 
 * @param {Request} request - Petición HTTP DELETE.
 * @param {Object} context - Objeto con el parámetro `id`.
 * @returns {Promise<Response>} Respuesta de éxito (200) o error 404/500.
 */
export async function DELETE(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("Patient")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Paciente eliminado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_DELETE]", error);
    return NextResponse.json(
      { error: "Error al eliminar el paciente" },
      { status: 500 }
    );
  }
}

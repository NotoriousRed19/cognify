import { NextResponse } from "next/server";
import { requireAuth, requireActiveSubscription } from "@/lib/auth-guard";

/**
 * Manejador de la petición GET para la ruta API de pacientes (Patients).
 * 
 * Propósito:
 * Consultar la lista de pacientes registrados bajo el profesional autenticado.
 * 
 * Flujo de ejecución:
 * 1. Verifica autenticación (`requireAuth`).
 * 2. Consulta la tabla `Patient` seleccionando los campos principales de contacto e identificación.
 * 3. Ordena los resultados por fecha de creación de forma descendente (los más recientes primero).
 * 
 * @param {Request} request - Objeto de la petición entrante.
 * @returns {Promise<Response>} Respuesta JSON con el listado de pacientes o un mensaje de error.
 */
export async function GET(request) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { data: patients, error } = await supabase
      .from("Patient")
      .select("id, nombre, identificacion, celular, fecha_nacimiento, sexo, nacionalidad, createdAt")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ patients }, { status: 200 });
  } catch (error) {
    console.error("[PATIENTS_GET]", error);
    return NextResponse.json(
      { error: "Error de servidor al obtener pacientes" },
      { status: 500 }
    );
  }
}

/**
 * Manejador de la petición POST para registrar un nuevo paciente.
 * 
 * Propósito:
 * Crear un nuevo expediente de paciente validando previamente que no existan duplicados
 * en los datos críticos de identificación y contacto.
 * 
 * Flujo de ejecución:
 * 1. Verifica que el profesional esté autenticado y con una suscripción activa.
 * 2. Extrae los datos enviados en el cuerpo JSON de la petición.
 * 3. Valida la presencia de campos obligatorios (nombre).
 * 4. Si se incluyen `identificacion`, `celular` o `email`, ejecuta una consulta tipo OR 
 *    para buscar pacientes del mismo doctor con esos datos y evitar registros duplicados.
 * 5. Valida y formatea la fecha de nacimiento.
 * 6. Inserta el nuevo paciente forzando el `doctor_id` actual.
 * 
 * @param {Request} request - Objeto de la petición con los datos del nuevo paciente.
 * @returns {Promise<Response>} Respuesta JSON con el paciente creado o un error HTTP (ej. 409 Conflict).
 */
export async function POST(request) {
  try {
    const { user, supabase, errorResponse } = await requireActiveSubscription();
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const {
      nombre,
      identificacion,
      celular,
      email,
      fecha_nacimiento,
      sexo,
      nacionalidad,
      historial_medico,
      medicacion,
    } = body;

    // Validación mínima obligatoria
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    if (identificacion || celular || email) {
      const orConditions = [];
      if (identificacion) {
        const safeId = identificacion.replace(/"/g, '');
        orConditions.push(`identificacion.eq."${safeId}"`);
      }
      if (celular && celular.length > 1) {
        const safeCelular = celular.replace(/"/g, '');
        orConditions.push(`celular.eq."${safeCelular}"`);
      }
      if (email) {
        const safeEmail = email.replace(/"/g, '');
        orConditions.push(`email.eq."${safeEmail}"`);
      }
      
      if (orConditions.length > 0) {
        const { data: existingPatients, error: searchError } = await supabase
          .from("Patient")
          .select("identificacion, celular, email")
          .eq("doctor_id", user.id)
          .or(orConditions.join(","));

        if (searchError) throw searchError;

        if (existingPatients && existingPatients.length > 0) {
          const duplicate = existingPatients[0];
          if (email && duplicate.email === email) {
            return NextResponse.json({ error: "El correo electrónico ya está registrado para otro paciente." }, { status: 409 });
          }
          if (identificacion && duplicate.identificacion === identificacion) {
            return NextResponse.json({ error: "Ya existe un paciente registrado con este número de identificación." }, { status: 409 });
          }
          if (celular && duplicate.celular === celular) {
            return NextResponse.json({ error: "Ya existe un paciente registrado con este número de celular." }, { status: 409 });
          }
        }
      }
    }

    let fechaNac = null;
    if (fecha_nacimiento) {
      const d = new Date(fecha_nacimiento);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });
      fechaNac = d.toISOString();
    }

    const { data: newPatient, error } = await supabase
      .from("Patient")
      .insert({
        id: crypto.randomUUID(),
        nombre,
        identificacion: identificacion || null,
        celular: celular || null,
        email: email || null,
        fecha_nacimiento: fechaNac,
        sexo: sexo || null,
        nacionalidad: nacionalidad || null,
        historial_medico: historial_medico || null,
        medicacion: medicacion || null,
        doctor_id: user.id, // Forzamos el RLS y relacion
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ patient: newPatient }, { status: 201 });
  } catch (error) {
    console.error("[PATIENTS_POST]", error);
    return NextResponse.json(
      { error: "Error de servidor al crear paciente" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuth, requireActiveSubscription } from "@/lib/auth-guard";

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

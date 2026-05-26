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

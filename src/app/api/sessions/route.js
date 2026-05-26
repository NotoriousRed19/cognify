import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

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

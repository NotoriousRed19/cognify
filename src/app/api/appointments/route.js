import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { data: appointments, error } = await supabase
      .from("Appointment")
      .select(`
        *,
        patient:Patient ( nombre )
      `)
      .order("fecha_inicio", { ascending: true });

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

export async function POST(request) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const {
      titulo,
      fecha_inicio,
      fecha_fin,
      patient_id
    } = body;

    if (!titulo || !fecha_inicio || !fecha_fin) {
      return NextResponse.json(
        { error: "Faltan parámetros de tiempo o título obligatorios" },
        { status: 400 }
      );
    }

    const { data: newAppointment, error } = await supabase
      .from("Appointment")
      .insert({
        id: crypto.randomUUID(),
        titulo,
        fecha_inicio: new Date(fecha_inicio).toISOString(),
        fecha_fin: new Date(fecha_fin).toISOString(),
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

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

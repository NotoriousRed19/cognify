import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const body = await request.json();

    const data = {};
    if (body.titulo !== undefined) data.titulo = body.titulo;
    if (body.fecha_inicio !== undefined) {
      const d = new Date(body.fecha_inicio);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Fecha de inicio inválida" }, { status: 400 });
      data.fecha_inicio = d.toISOString();
    }
    if (body.fecha_fin !== undefined) {
      const d = new Date(body.fecha_fin);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Fecha de fin inválida" }, { status: 400 });
      data.fecha_fin = d.toISOString();
    }
    if (body.patient_id !== undefined) data.patient_id = body.patient_id || null;
    if (body.estado !== undefined) data.estado = body.estado;

    const { data: updated, error } = await supabase
      .from("Appointment")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Cita no encontrada o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ appointment: updated }, { status: 200 });
  } catch (error) {
    console.error("[APPOINTMENT_PATCH]", error);
    return NextResponse.json({ error: "Error al actualizar la cita" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("Appointment")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Cita no encontrada o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Cita eliminada exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("[APPOINTMENT_DELETE]", error);
    return NextResponse.json({ error: "Error al eliminar la cita" }, { status: 500 });
  }
}

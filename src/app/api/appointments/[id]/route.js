import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function PATCH(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await request.json();

    const data = {};
    if (body.titulo !== undefined) data.titulo = body.titulo;
    if (body.fecha_inicio !== undefined) data.fecha_inicio = new Date(body.fecha_inicio).toISOString();
    if (body.fecha_fin !== undefined) data.fecha_fin = new Date(body.fecha_fin).toISOString();
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

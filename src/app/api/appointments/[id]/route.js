import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { z } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const UpdateAppointmentSchema = z.object({
  titulo: z.string().max(255).optional(),
  fecha_inicio: z.string().datetime().optional(),
  fecha_fin: z.string().datetime().optional(),
  patient_id: z.string().regex(UUID_REGEX, "patient_id inválido").nullable().optional(),
  estado: z.enum(["AGENDADA", "COMPLETADA", "CANCELADA"]).optional(),
  status: z.enum(["PENDING_APPROVAL", "CONFIRMED", "REJECTED", "CANCELLED"]).optional()
});

export async function PATCH(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    
    const rawBody = await request.json();
    const parsed = UpdateAppointmentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // Optional: Validate patient_id belongs to the doctor
    if (data.patient_id) {
      const { data: patient } = await supabase
        .from("Patient")
        .select("id")
        .eq("id", data.patient_id)
        .eq("doctor_id", user.id)
        .single();
      
      if (!patient) {
        return NextResponse.json({ error: "Paciente inválido o no autorizado" }, { status: 403 });
      }
    }

    // Obtener la cita actual para ver si estamos aprobándola
    const { data: currentAppt } = await supabase
      .from("Appointment")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentAppt) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    // Si estamos aprobando una cita pública
    if (data.status === "CONFIRMED" && currentAppt.status === "PENDING_APPROVAL" && currentAppt.source === "PUBLIC") {
      // Llamar al RPC seguro para aprobar y crear paciente
      const { data: rpcResult, error: rpcError } = await supabase.rpc("rpc_approve_appointment", {
        p_appointment_id: id,
        p_doctor_id: user.id
      });

      if (rpcError) {
        console.error("[RPC APPROVE ERROR]", rpcError);
        return NextResponse.json({ error: "Error al aprobar la reserva: " + rpcError.message }, { status: 400 });
      }

      // Simular envío de notificación (Email / SMS)
      console.log(`[NOTIFICACIÓN] Enviando EMAIL y SMS a ${currentAppt.guest_contact}: Tu cita ha sido APROBADA.`);
      
      // Ya se actualizó en la BD, devolver éxito
      return NextResponse.json({ success: true, message: "Aprobada y paciente creado" }, { status: 200 });
    }

    // Si estamos rechazando
    if (data.status === "REJECTED" && currentAppt.status === "PENDING_APPROVAL") {
      console.log(`[NOTIFICACIÓN] Enviando EMAIL y SMS a ${currentAppt.guest_contact}: Tu cita ha sido RECHAZADA.`);
      
      const { error: deleteError } = await supabase
        .from("Appointment")
        .delete()
        .eq("id", id);
        
      if (deleteError) {
        return NextResponse.json({ error: "Error al borrar la cita rechazada" }, { status: 403 });
      }
      
      return NextResponse.json({ success: true, message: "Cita rechazada y eliminada" }, { status: 200 });
    }

    const { data: updated, error } = await supabase
      .from("Appointment")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Error al actualizar o acceso denegado" }, { status: 403 });
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

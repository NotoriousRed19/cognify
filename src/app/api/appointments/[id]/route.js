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

/**
 * Manejador de la petición PATCH para actualizar una cita médica específica.
 * 
 * Propósito:
 * Permite actualizar los detalles de una cita o gestionar el flujo de aprobación
 * de reservas creadas por pacientes desde el portal público.
 * 
 * Flujo de ejecución:
 * 1. Verifica autenticación del profesional (`requireAuth`).
 * 2. Valida el formato del UUID de la cita y el esquema del body con Zod.
 * 3. Si se aprueba una reserva pública (`CONFIRMED`), invoca un RPC (`rpc_approve_appointment`) 
 *    para crear el paciente si no existe y aprueba la cita atómicamente, luego envía notificación por correo.
 * 4. Si se rechaza (`REJECTED`), hace un soft-delete de la cita y envía notificación de rechazo.
 * 5. Bloquea cambios manuales directos al campo `status` fuera de estos flujos.
 * 6. Valida que las transiciones de `estado` (ej. de AGENDADA a COMPLETADA) sean lógicas.
 * 7. Ejecuta la actualización regular si no es un flujo de aprobación/rechazo.
 * 
 * @param {Request} request - Objeto de la petición con los campos a actualizar.
 * @param {Object} context - Contexto que contiene los parámetros de la URL (`id`).
 * @returns {Promise<Response>} Respuesta JSON con el resultado de la operación.
 */
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

    // Obtener la cita actual y el nombre del doctor
    const { data: currentAppt } = await supabase
      .from("Appointment")
      .select("*, User(name)")
      .eq("id", id)
      .single();

    if (!currentAppt) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }
    
    // Extraer el nombre del doctor (User está unido por FK)
    const realDoctorName = currentAppt.User?.name || "Especialista";

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

      try {
        const { notificationService } = await import("@/lib/notification-service");
        const email = currentAppt.guest_details?.email;
        if (email) {
          await notificationService.notifyPatientBookingStatus({
            doctorId: user.id,
            appointmentId: id,
            patientEmail: email,
            patientName: currentAppt.guest_name,
            doctorName: realDoctorName,
            appointmentDate: currentAppt.fecha_inicio,
            status: 'APPROVED'
          });
        }
      } catch (notifErr) {
        console.error("[NOTIF ERROR] No se pudo notificar al paciente de la aprobación:", notifErr);
      }

      // Ya se actualizó en la BD, devolver éxito
      return NextResponse.json({ success: true, message: "Aprobada y paciente creado" }, { status: 200 });
    }

    // Si estamos rechazando
    if (data.status === "REJECTED" && currentAppt.status === "PENDING_APPROVAL") {
      // Primero actualizar el estado a REJECTED (soft delete — preservar historial)
      const { error: rejectError } = await supabase
        .from("Appointment")
        .update({ status: "REJECTED" })
        .eq("id", id);
        
      if (rejectError) {
        return NextResponse.json({ error: "Error al rechazar la cita" }, { status: 403 });
      }

      // Notificar al paciente del rechazo (no bloqueante)
      try {
        const { notificationService } = await import("@/lib/notification-service");
        const email = currentAppt.guest_details?.email;
        if (email) {
          await notificationService.notifyPatientBookingStatus({
            doctorId: user.id,
            appointmentId: id,
            patientEmail: email,
            patientName: currentAppt.guest_name,
            doctorName: realDoctorName,
            appointmentDate: currentAppt.fecha_inicio,
            status: 'REJECTED'
          });
        }
      } catch (notifErr) {
        console.error("[NOTIF ERROR] No se pudo notificar al paciente del rechazo:", notifErr);
      }
      
      return NextResponse.json({ success: true, message: "Cita rechazada" }, { status: 200 });
    }

    // Bloquear cambios directos de status fuera de los flujos de aprobación/rechazo
    // Esto previene que alguien envíe { status: "CONFIRMED" } para saltarse el RPC
    if (data.status) {
      return NextResponse.json({ error: "No puedes cambiar el estado directamente. Usa los flujos de aprobación/rechazo." }, { status: 400 });
    }

    // Validar transiciones de estado de la cita
    if (data.estado) {
      const allowedTransitions = {
        'AGENDADA': ['COMPLETADA', 'CANCELADA'],
        'COMPLETADA': [],
        'CANCELADA': []
      };

      const currentEstado = currentAppt.estado || 'AGENDADA';
      if (!allowedTransitions[currentEstado] || !allowedTransitions[currentEstado].includes(data.estado)) {
        return NextResponse.json({ error: `Transición de estado inválida de ${currentEstado} a ${data.estado}` }, { status: 400 });
      }
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

/**
 * Manejador de la petición DELETE para cancelar una cita médica.
 * 
 * Propósito:
 * Ejecutar un "soft delete" sobre una cita, cambiándole el estado a CANCELADA
 * en lugar de eliminar el registro físico de la base de datos, preservando el historial.
 * 
 * Flujo de ejecución:
 * 1. Verifica autenticación del profesional (`requireAuth`).
 * 2. Valida que el ID proporcionado sea un UUID válido.
 * 3. Actualiza el registro en la base de datos fijando `estado: "CANCELADA"` y `status: "REJECTED"`.
 * 4. Verifica que la política RLS haya permitido la actualización (el doctor es dueño de la cita).
 * 
 * @param {Request} request - Objeto de la petición DELETE.
 * @param {Object} context - Contexto que contiene los parámetros de la URL (`id`).
 * @returns {Promise<Response>} Respuesta JSON confirmando la cancelación o error de acceso.
 */
export async function DELETE(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Soft delete: cambiar estado a CANCELADA en lugar de borrar físicamente
    const { data, error } = await supabase
      .from("Appointment")
      .update({ estado: "CANCELADA", status: "REJECTED" }) // Update both status and estado just in case
      .eq("id", id)
      .select();

    if (error) {
      console.error("[APPOINTMENT_DELETE_DB_ERROR]", error);
      return NextResponse.json({ error: "Error de DB al cancelar", details: error }, { status: 403 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Cita no encontrada o acceso denegado por políticas de seguridad" }, { status: 404 });
    }

    return NextResponse.json({ message: "Cita cancelada exitosamente", appointment: data[0] }, { status: 200 });
  } catch (error) {
    console.error("[APPOINTMENT_DELETE]", error);
    return NextResponse.json({ error: "Error al cancelar la cita" }, { status: 500 });
  }
}

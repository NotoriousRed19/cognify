import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";

// Validation schema
const RequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  apellido: z.string().min(1, "El apellido es requerido").max(100),
  identificacion: z.string().min(1, "La identificación es requerida").max(50),
  celular: z.string().min(1, "El celular es requerido").max(50),
  nacionalidad: z.string().min(1, "La nacionalidad es requerida").max(100),
  sexo: z.string().min(1, "El sexo es requerido").max(50),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha de nacimiento inválido"),
  email: z.string().email("Formato de correo inválido").optional().or(z.literal(""))
});

export async function POST(request, { params }) {
  const { slug } = await params;
  
  try {
    const rawBody = await request.json();
    
    // Zod validation
    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
    }
    
    const { date, time, nombre, apellido, identificacion, celular, nacionalidad, sexo, fecha_nacimiento, email } = parsed.data;

    const guest_name = `${nombre} ${apellido}`;
    const guest_details = {
      nombre,
      apellido,
      identificacion,
      celular,
      email,
      nacionalidad,
      sexo,
      fecha_nacimiento
    };

    const supabase = await createClient();

    // Obtener datos del doctor para la notificación
    const { data: doctorData } = await supabase
      .from('User')
      .select('id, email, name')
      .eq('slug', slug)
      .single();

    // Default a una zona horaria (TODO: obtenerla del doctor desde la BD en el futuro)
    const doctorTimeZone = "America/Caracas";

    // Calcular el UTC exacto del inicio
    const slotStartUtc = fromZonedTime(`${date}T${time}:00`, doctorTimeZone);
    
    if (isNaN(slotStartUtc.getTime())) {
      return NextResponse.json({ error: "Fecha/Hora resultaron en un tiempo inválido" }, { status: 400 });
    }

    // ── Novedad: Validar que el paciente no exista (idéntico al dashboard) ──
    const safeIdentificacion = identificacion.replace(/"/g, '');
    const safeCelular = celular.replace(/"/g, '');
    
    const { data: existingPatient } = await supabase
      .from('Patient')
      .select('id')
      .eq('doctor_id', doctorData.id)
      .or(`identificacion.eq."${safeIdentificacion}",celular.eq."${safeCelular}"`)
      .limit(1)
      .maybeSingle();

    if (existingPatient) {
      return NextResponse.json({ 
        error: "Identificación o celular ya registrado" 
      }, { status: 409 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Calcular el UTC exacto del fin (+1 hora)
    const slotEndUtc = new Date(slotStartUtc.getTime() + (60 * 60 * 1000));

    // Insertar mediante el RPC seguro
    const { data: result, error: rpcError } = await supabase.rpc("rpc_request_appointment", {
      p_slug: slug,
      p_fecha_inicio: slotStartUtc.toISOString(),
      p_fecha_fin: slotEndUtc.toISOString(),
      p_guest_name: guest_name,
      p_guest_contact: celular,
      p_guest_details: guest_details
    });

    if (rpcError) {
      console.error("[REQUEST RPC ERROR]", rpcError);
      
      if (rpcError.message.includes('El horario ya no está disponible')) {
        return NextResponse.json({ error: "El horario ya no está disponible" }, { status: 409 });
      }
      if (rpcError.message === 'Doctor no encontrado') {
        return NextResponse.json({ error: "Doctor no encontrado" }, { status: 404 });
      }
      if (rpcError.message === 'Reservas deshabilitadas') {
        return NextResponse.json({ error: "Las reservas están deshabilitadas" }, { status: 403 });
      }

      return NextResponse.json({ error: "Error al crear la reserva" }, { status: 500 });
    }

    // Enviar notificación al doctor en segundo plano (no-bloqueante)
    // El paciente recibe su respuesta de éxito inmediatamente
    try {
      if (doctorData && doctorData.email) {
        const { notificationService } = await import("@/lib/notification-service");
        notificationService.notifyDoctorNewBooking({
          doctorId: doctorData.id,
          doctorEmail: doctorData.email,
          doctorName: doctorData.name,
          patientName: guest_name,
          patientContact: celular,
          patientEmail: email,
          appointmentDate: slotStartUtc.toISOString(),
          appointmentId: result.appointment_id
        }).catch(err => console.error("[NOTIF ERROR] No se pudo enviar el correo al doctor:", err));
      }
    } catch (notifErr) {
      console.error("[NOTIF ERROR] Error importando notification-service:", notifErr);
    }

    return NextResponse.json({ success: true, appointment_id: result.appointment_id });

  } catch (err) {
    console.error("[REQUEST ERROR]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

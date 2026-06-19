import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { z } from "zod";

const AvailabilityBlockSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)
});

const ConfigSchema = z.object({
  slug: z.string().min(3).max(50).optional().nullable().or(z.literal("")),
  booking_enabled: z.boolean().optional(),
  payment_instructions: z.string().max(1000).optional().nullable().or(z.literal("")),
  pricing_info: z.object({
    service1: z.string().max(100).optional(),
    service2: z.string().max(100).optional(),
    service3: z.string().max(100).optional(),
    exchangeRate: z.string().max(100).optional()
  }).optional().nullable(),
  availability: z.array(AvailabilityBlockSchema).optional(),
  reminder_24h: z.boolean().optional(),
  custom_reminder_message: z.string().max(500).optional().nullable().or(z.literal(""))
});

/**
 * Manejador de la petición GET para obtener la configuración completa del usuario.
 * 
 * Propósito:
 * Consultar y devolver todas las preferencias, configuración de portal público, 
 * disponibilidad de horarios y ajustes de notificaciones del profesional.
 * 
 * Flujo de ejecución:
 * 1. Verifica la sesión y autenticación del usuario (`requireAuth`).
 * 2. Consulta la tabla `User` para extraer configuración pública (slug, pagos, precios).
 * 3. Consulta la tabla `Availability` para listar los bloques horarios del doctor.
 * 4. Consulta la tabla `NotificationPreference` para obtener las reglas de recordatorios.
 * 5. Empaqueta los resultados en un único JSON consolidado.
 * 
 * @param {Request} request - Petición entrante HTTP GET.
 * @returns {Promise<Response>} JSON con `user`, `availability` y `notifications`, o error 500.
 */
export async function GET(request) {
  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const userId = user.id;

  // Obtener perfil del usuario
  const { data: userData, error: userError } = await supabase
    .from("User")
    .select("slug, booking_enabled, payment_instructions, pricing_info")
    .eq("id", userId)
    .single();

  if (userError) {
    return NextResponse.json({ error: "Error obteniendo perfil" }, { status: 500 });
  }

  // Obtener horarios
  const { data: availability, error: availError } = await supabase
    .from("Availability")
    .select("id, day_of_week, start_time, end_time")
    .eq("doctor_id", userId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (availError) {
    return NextResponse.json({ error: "Error obteniendo disponibilidad" }, { status: 500 });
  }

  // Obtener preferencias de notificación
  const { data: notifPrefs } = await supabase
    .from("NotificationPreference")
    .select("reminder_24h, custom_reminder_message")
    .eq("doctor_id", userId)
    .single();

  return NextResponse.json({ user: userData, availability, notifications: notifPrefs });
}

/**
 * Manejador de la petición POST para guardar cambios en la configuración del usuario.
 * 
 * Propósito:
 * Actualizar las preferencias del perfil, el slug público, los bloques de disponibilidad
 * y la configuración de recordatorios.
 * 
 * Flujo de ejecución:
 * 1. Autentica al usuario (`requireAuth`).
 * 2. Valida la estructura del payload JSON mediante Zod (`ConfigSchema`).
 * 3. Valida la unicidad del `slug` verificando que ningún otro usuario lo posea. 
 *    Si está en uso, retorna un error 400 con sugerencias alternativas.
 * 4. Actualiza los campos principales en la tabla `User` (slug, reservas, pagos, precios).
 * 5. Actualiza los horarios usando la función RPC `rpc_update_availability`, la cual
 *    elimina los bloques anteriores y crea los nuevos de forma atómica.
 * 6. Inserta o actualiza (`upsert`) las reglas en `NotificationPreference`.
 * 
 * @param {Request} request - Petición con el JSON consolidado de configuraciones.
 * @returns {Promise<Response>} Respuesta de éxito o error detallado de validación/conflictos.
 */
export async function POST(request) {
  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const userId = user.id;
  
  try {
    const rawBody = await request.json();
    const parsed = ConfigSchema.safeParse(rawBody);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
    }
    
    const { slug, booking_enabled, payment_instructions, pricing_info, availability, reminder_24h, custom_reminder_message } = parsed.data;

    // 1. Validar unicidad del slug
    if (slug) {
      const { data: existingUser } = await supabase
        .from("User")
        .select("id")
        .eq("slug", slug)
        .neq("id", userId)
        .single();

      if (existingUser) {
        const suggestions = [
          `${slug}-dr`,
          `${slug}-${Math.floor(Math.random() * 1000)}`,
          `${slug}-med`
        ];
        return NextResponse.json({ 
          error: "slug_in_use", 
          message: "El nombre de enlace ya está en uso.",
          suggestions 
        }, { status: 400 });
      }
    }

    // 2. Actualizar perfil
    const { error: updateError } = await supabase
      .from("User")
      .update({ 
        slug: slug || null, 
        booking_enabled: booking_enabled !== undefined ? booking_enabled : true, 
        payment_instructions: payment_instructions || null,
        pricing_info: pricing_info || {}
      })
      .eq("id", userId);

    if (updateError) {
      if (updateError.code === "23505") { // Unique violation
        const suggestions = [
          `${slug}-dr`,
          `${slug}-${Math.floor(Math.random() * 1000)}`,
          `${slug}-med`
        ];
        return NextResponse.json({ 
          error: "slug_in_use", 
          message: "El nombre de enlace ya está en uso.",
          suggestions 
        }, { status: 400 });
      }
      return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
    }

    // 3. Reemplazar disponibilidad usando RPC
    if (availability) {
      const { error: rpcError } = await supabase.rpc("rpc_update_availability", {
        p_doctor_id: userId,
        p_blocks: availability
      });

      if (rpcError) {
        console.error("[RPC UPDATE AVAILABILITY ERROR]", rpcError);
        return NextResponse.json({ error: "Error guardando disponibilidad" }, { status: 500 });
      }
    }

    // 4. Actualizar Preferencias de Notificación
    if (reminder_24h !== undefined || custom_reminder_message !== undefined) {
      const { error: notifError } = await supabase
        .from("NotificationPreference")
        .upsert({
          doctor_id: userId,
          reminder_24h: reminder_24h !== undefined ? reminder_24h : true,
          custom_reminder_message: custom_reminder_message || null,
          updatedAt: new Date().toISOString()
        }, { onConflict: 'doctor_id' });

      if (notifError) {
        console.error("[NOTIF PREF ERROR]", notifError);
      }
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("[CONFIG POST ERROR]", error);
    return NextResponse.json({ error: "Error procesando solicitud" }, { status: 500 });
  }
}

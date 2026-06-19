import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { createClient } from "@supabase/supabase-js";

/**
 * Manejador de la petición PATCH para la ruta API de suscripciones (Administrador).
 * 
 * Propósito:
 * Permite a los administradores modificar el estado de la suscripción de un usuario 
 * específico y opcionalmente extender sus días de facturación.
 * 
 * Flujo de ejecución:
 * 1. Verifica que el usuario actual tenga privilegios de administrador (`requireAdmin`).
 * 2. Extrae los datos del cuerpo JSON (`user_id`, `plan_status`, `extra_days`).
 * 3. Valida la presencia de los parámetros obligatorios.
 * 4. Si se envían `extra_days`, calcula la nueva fecha de facturación (`next_billing_date`).
 * 5. Utiliza el Service Role de Supabase (`supabaseAdmin`) para eludir RLS, dado que 
 *    los usuarios (incluso admins autenticados) no pueden editar suscripciones ajenas por seguridad.
 * 6. Actualiza la tabla `Subscription` y retorna el registro modificado.
 * 
 * @param {Request} request - Objeto de la petición entrante con el payload JSON.
 * @returns {Promise<Response>} Respuesta JSON con la suscripción actualizada o un mensaje de error.
 */
export async function PATCH(request) {
  try {
    const { supabase, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { user_id, plan_status, extra_days } = body;

    if (!user_id || !plan_status) {
      return NextResponse.json(
        { error: "Faltan parámetros obligatorios" },
        { status: 400 }
      );
    }

    let next_billing_date = null;
    if (extra_days) {
      const date = new Date();
      date.setDate(date.getDate() + Number(extra_days));
      next_billing_date = date.toISOString();
    }

    const updates = {
      plan_status,
      updatedAt: new Date().toISOString()
    };

    if (next_billing_date) {
      updates.next_billing_date = next_billing_date;
      updates.last_payment_date = new Date().toISOString();
    }

    // El admin login es validado por su correo, pero el cliente regular supabase
    // está atado a SU propio token RLS, no puede editar subscripciones de otros.
    // Usaremos un cliente de admin local para bypasear el RLS.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: updatedSub, error } = await supabaseAdmin
      .from("Subscription")
      .update(updates)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ subscription: updatedSub }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN_SUBSCRIPTIONS_PATCH]", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la suscripción", fullError: error },
      { status: 500 }
    );
  }
}

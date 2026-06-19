import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { createClient } from "@supabase/supabase-js";

/**
 * Manejador de la petición GET para la ruta API de usuarios administradores.
 * 
 * Propósito:
 * Obtener la lista completa de usuarios registrados junto con los detalles de 
 * sus suscripciones, para gestionarlos en el panel de administración.
 * 
 * Flujo de ejecución:
 * 1. Verifica que el usuario actual tenga permisos de administrador (`requireAdmin`).
 * 2. Utiliza el Service Role de Supabase para eludir el RLS y leer todos los registros.
 * 3. Consulta la tabla `User` y realiza un join con `Subscription`.
 * 4. Filtra explícitamente la cuenta del administrador principal de los resultados 
 *    para evitar modificaciones accidentales (ej. suspensión de su propia cuenta).
 * 
 * @param {Request} request - Objeto de la petición entrante.
 * @returns {Promise<Response>} Respuesta en formato JSON con la lista de usuarios, o un mensaje de error.
 */
export async function GET(request) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    // Usamos el cliente admin para bypasear RLS y poder ver a todos los usuarios
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Obtener todos los usuarios con su respectiva suscripción
    const { data: users, error } = await supabaseAdmin
      .from("User")
      .select(`
        id,
        email,
        name,
        Subscription (
          plan_status,
          trial_ends_at,
          last_payment_date,
          next_billing_date
        )
      `)
      .order("email", { ascending: true });

    if (error) throw error;

    // Filtrar al administrador de la lista para evitar que se suspenda a sí mismo por error
    const adminEmail = 'mauriciocotufa@gmail.com';
    const filteredUsers = users.filter(u => u.email?.toLowerCase() !== adminEmail);

    return NextResponse.json({ users: filteredUsers }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return NextResponse.json(
      { error: "Error al obtener la lista de usuarios" },
      { status: 500 }
    );
  }
}

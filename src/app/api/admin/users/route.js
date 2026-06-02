import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { createClient } from "@supabase/supabase-js";

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

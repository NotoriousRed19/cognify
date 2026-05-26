import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Helper centralizado de autenticación para API routes (Supabase Version).
 *
 * @returns {{ session: object|null, user: object|null, errorResponse: NextResponse|null, supabase: object|null }}
 */
export async function requireAuth() {
  const supabase = await createClient();
  // getUser() valida el JWT contra el servidor de Supabase — no confía ciegamente en las cookies
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || !user.id) {
    return {
      session: null,
      user: null,
      supabase: null,
      errorResponse: NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      ),
    };
  }

  return {
    session: null, // No es necesario con getUser()
    user,
    supabase,
    errorResponse: null,
  };
}

/**
 * Helper para proteger rutas exclusivas del administrador.
 */
export async function requireAdmin() {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth;

  const adminEmail = process.env.ADMIN_EMAIL;
  const userRole = auth.user.app_metadata?.role || auth.user.user_metadata?.role || 'Usuario';
  
  const isEmailAdmin = adminEmail && auth.user.email?.toLowerCase() === adminEmail.toLowerCase();
  const isRoleAdmin = userRole === 'Administrador';

  if (!isEmailAdmin && !isRoleAdmin) {
    return {
      ...auth,
      errorResponse: NextResponse.json(
        { error: "Acceso denegado. Se requieren privilegios de administrador." },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Helper para asegurar que el usuario tenga una suscripción activa o en trial.
 */
export async function requireActiveSubscription() {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth;

  const { data: sub } = await auth.supabase
    .from("Subscription")
    .select("plan_status, trial_ends_at, next_billing_date")
    .eq("user_id", auth.user.id)
    .single();

  const now = new Date().getTime();
  let isExpired = !sub || sub.plan_status === "EXPIRED";

  if (!isExpired) {
    if (sub.plan_status === "TRIAL" && sub.trial_ends_at) {
      if (new Date(sub.trial_ends_at).getTime() < now) isExpired = true;
    } else if (sub.plan_status === "ACTIVE" && sub.next_billing_date) {
      // Damos un periodo de gracia de 24 horas
      const gracePeriod = 24 * 60 * 60 * 1000;
      if (new Date(sub.next_billing_date).getTime() + gracePeriod < now) isExpired = true;
    }
  }

  if (isExpired) {
    return {
      ...auth,
      errorResponse: NextResponse.json(
        { error: "Suscripción inactiva o expirada. Por favor contacta a administración." },
        { status: 403 }
      ),
    };
  }

  return auth;
}

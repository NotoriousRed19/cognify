import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Helper centralizado de autenticación para API routes (Supabase Version).
 *
 * @returns {{ session: object|null, user: object|null, errorResponse: NextResponse|null, supabase: object|null }}
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session || !session.user || !session.user.id) {
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
    session,
    user: session.user,
    supabase,
    errorResponse: null,
  };
}

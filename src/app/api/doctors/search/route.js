import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Sanitize PostgREST special characters to prevent filter injection
function sanitizePostgrestInput(str) {
  return str.replace(/[,.()"'\\]/g, "");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  try {
    // Use anon key — the query only reads public-facing fields with booking_enabled=true
    const supabaseAnon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let query = supabaseAnon
      .from("User")
      .select("id, name, email, slug")
      .eq("booking_enabled", true)
      .limit(10);

    if (q.trim().length > 0) {
      const sanitized = sanitizePostgrestInput(q.trim());
      if (sanitized.length > 0) {
        query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,slug.ilike.%${sanitized}%`);
      }
    } else {
      // Opcional: ordenar al azar o por fecha para mostrar una lista por defecto atractiva
      query = query.order('name', { ascending: true });
    }

    const { data: doctors, error } = await query;

    if (error) {
      console.error("[SEARCH_DOCTORS]", error);
      return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
    }

    return NextResponse.json({ doctors: doctors || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

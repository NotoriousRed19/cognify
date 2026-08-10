import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Manejador de la petición GET para el Cron Job que mantiene activa la base de datos de Supabase.
 * Se ejecuta automáticamente cada ciertos días a través de Vercel Cron.
 */
export async function GET(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Hacemos una consulta muy ligera para registrar actividad
    const { data, error } = await supabaseAdmin
      .from("Availability")
      .select("id")
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Base de datos activa" });
  } catch (error) {
    console.error("[KEEP ALIVE ERROR]", error);
    return NextResponse.json({ error: "Error en keep-alive" }, { status: 500 });
  }
}

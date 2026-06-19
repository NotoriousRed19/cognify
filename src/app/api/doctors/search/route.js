import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Sanea la entrada de búsqueda eliminando caracteres especiales de PostgREST
 * para evitar inyecciones en los filtros de la consulta.
 * @param {string} str - Cadena de búsqueda sin procesar.
 * @returns {string} Cadena saneada.
 */
function sanitizePostgrestInput(str) {
  return str.replace(/[,.()"'\\]/g, "");
}

/**
 * Manejador de la petición GET para el buscador público de doctores.
 * 
 * Propósito:
 * Permitir a los pacientes buscar profesionales en la plataforma mediante coincidencias
 * parciales (nombre, email o slug) para redirigirlos a su portal de reservas correspondiente.
 * 
 * Flujo de ejecución:
 * 1. Extrae el parámetro de búsqueda `q` de la URL.
 * 2. Utiliza la clave anónima (`anon key`) de Supabase, ya que es un endpoint público
 *    y solo debe consultar datos no sensibles.
 * 3. Aplica un filtro estricto: solo doctores con `booking_enabled = true`.
 * 4. Si hay un término de búsqueda, sanea el string y aplica un filtro OR (`.ilike`) 
 *    sobre nombre, correo o slug.
 * 5. Si no hay término de búsqueda, devuelve una lista base ordenada alfabéticamente.
 * 6. Limita los resultados a 10 para optimización.
 * 
 * @param {Request} request - Petición HTTP con el parámetro `?q=término`.
 * @returns {Promise<Response>} Respuesta JSON con el arreglo de doctores encontrados.
 */
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

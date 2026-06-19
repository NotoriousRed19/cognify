import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Manejador de la petición POST para validación inicial de pacientes en el portal de reservas.
 * 
 * Propósito:
 * Recibir datos identificativos de un paciente durante el proceso de reserva para
 * determinar el comportamiento de la interfaz.
 * 
 * Flujo de ejecución:
 * 1. Extrae el `slug` del doctor desde la URL.
 * 2. Lee la identificación y celular enviados en el cuerpo JSON.
 * 3. Usa el Service Role de Supabase para evadir RLS, ya que la petición es pública.
 * 4. Verifica que el doctor referenciado por el `slug` exista en la base de datos.
 * 5. Por diseño actual, retorna `exists: false` permitiendo que pacientes recurrentes agenden.
 *    La lógica de consolidación y unicidad de expedientes se delega al backend
 *    (RPC `rpc_approve_appointment`) una vez que el doctor aprueba la cita.
 * 
 * @param {Request} request - Objeto de la petición con `identificacion` y/o `celular`.
 * @param {Object} context - Objeto con el parámetro de ruta (`slug`).
 * @returns {Promise<Response>} Respuesta JSON retornando siempre `exists: false` o error de servidor.
 */
export async function POST(request, { params }) {
  const { slug } = await params;
  
  try {
    const { identificacion, celular } = await request.json();
    
    if (!identificacion && !celular) {
      return NextResponse.json({ error: "Datos faltantes" }, { status: 400 });
    }

    // Cliente admin para saltarse el RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Obtener datos del doctor
    const { data: doctorData } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!doctorData) {
      return NextResponse.json({ error: "Doctor no encontrado" }, { status: 404 });
    }

    // Retornamos exists: false porque los pacientes recurrentes son bienvenidos.
    // La unicidad estricta y consolidación de expedientes se realiza en el dashboard mediante el RPC.
    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("[VALIDATE ERROR]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";


/**
 * Manejador de la petición DELETE para eliminar una sesión clínica (evolución).
 * 
 * Propósito:
 * Permitir al profesional de la salud borrar un registro específico del historial
 * clínico de un paciente si fue creado por error.
 * 
 * Flujo de ejecución:
 * 1. Verifica la sesión y seguridad del usuario (`requireAuth`).
 * 2. Valida la presencia del `id` de la sesión en la ruta.
 * 3. Intenta eliminar la fila correspondiente en la tabla `TherapySession`.
 *    (Las políticas RLS aseguran que la operación falle si el doctor 
 *    no es el dueño del paciente vinculado a esta sesión).
 * 4. Retorna el resultado de la operación (éxito 200 o error 404/403).
 * 
 * @param {Request} request - Objeto de la petición HTTP DELETE.
 * @param {Object} context - Objeto que contiene los parámetros de la ruta (`id`).
 * @returns {Promise<Response>} Mensaje JSON de éxito o de error.
 */
export async function DELETE(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID faltante" }, { status: 400 });
    }

    const { error } = await supabase
      .from("TherapySession")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Sesión no encontrada o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Sesión eliminada exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("[SESSION_DELETE]", error);
    return NextResponse.json(
      { error: "Error de servidor al eliminar sesión" },
      { status: 500 }
    );
  }
}

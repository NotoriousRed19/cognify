import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";


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

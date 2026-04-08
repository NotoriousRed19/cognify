import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.therapySession.findFirst({
      where: {
        id,
        patient: {
          doctor_id: session.user.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Sesión no encontrada o acceso denegado" }, { status: 404 });
    }

    await prisma.therapySession.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sesión eliminada exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("[SESSION_DELETE]", error);
    return NextResponse.json(
      { error: "Error de servidor al eliminar sesión" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.appointment.findFirst({
      where: { id, doctor_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cita no encontrada o acceso denegado" }, { status: 404 });
    }

    const data = {};
    if (body.titulo !== undefined) data.titulo = body.titulo;
    if (body.fecha_inicio !== undefined) data.fecha_inicio = new Date(body.fecha_inicio);
    if (body.fecha_fin !== undefined) data.fecha_fin = new Date(body.fecha_fin);
    if (body.patient_id !== undefined) data.patient_id = body.patient_id || null;
    if (body.estado !== undefined) data.estado = body.estado;

    const updated = await prisma.appointment.update({
      where: { id },
      data,
    });

    return NextResponse.json({ appointment: updated }, { status: 200 });
  } catch (error) {
    console.error("[APPOINTMENT_PATCH]", error);
    return NextResponse.json({ error: "Error al actualizar la cita" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.appointment.findFirst({
      where: { id, doctor_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cita no encontrada o acceso denegado" }, { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Cita eliminada exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("[APPOINTMENT_DELETE]", error);
    return NextResponse.json({ error: "Error al eliminar la cita" }, { status: 500 });
  }
}

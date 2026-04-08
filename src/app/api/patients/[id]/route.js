import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: {
        id: id,
        doctor_id: session.user.id, // Validación de seguridad estricta
      },
      include: {
        sesiones: {
          orderBy: { fecha_sesion: "desc" },
        },
        appointments: {
          orderBy: { fecha_inicio: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ patient }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_GET]", error);
    return NextResponse.json(
      { error: "Error de servidor al obtener detalles del paciente" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el paciente pertenece al doctor
    const existing = await prisma.patient.findFirst({
      where: { id, doctor_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    const body = await request.json();

    // Solo actualizamos los campos que vienen en el body (patch parcial)
    const allowedFields = ["nombre", "identificacion", "celular", "fecha_nacimiento", "sexo", "nacionalidad", "historial_medico", "medicacion"];
    const data = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === "fecha_nacimiento" && body[field]) {
          data[field] = new Date(body[field]);
        } else {
          data[field] = body[field] || null;
        }
      }
    }

    const updated = await prisma.patient.update({
      where: { id },
      data,
    });

    return NextResponse.json({ patient: updated }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_PATCH]", error);
    return NextResponse.json(
      { error: "Error al actualizar el paciente" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.patient.findFirst({
      where: { id, doctor_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Paciente eliminado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_DELETE]", error);
    return NextResponse.json(
      { error: "Error al eliminar el paciente" },
      { status: 500 }
    );
  }
}

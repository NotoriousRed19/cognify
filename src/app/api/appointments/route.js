import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: session.user.id,
      },
      include: {
        patient: {
          select: {
            nombre: true,
          }
        }
      },
      orderBy: {
        fecha_inicio: "asc",
      },
    });

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error("[APPOINTMENTS_GET]", error);
    return NextResponse.json(
      { error: "Error interno al obtener la agenda" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      titulo,
      fecha_inicio,
      fecha_fin,
      patient_id
    } = body;

    if (!titulo || !fecha_inicio || !fecha_fin) {
      return NextResponse.json(
        { error: "Faltan parámetros de tiempo o título obligatorios" },
        { status: 400 }
      );
    }

    // Si pasaron un paciente, validemos que el profesional es el dueño
    if (patient_id) {
      const patientData = await prisma.patient.findFirst({
        where: { id: patient_id, doctor_id: session.user.id }
      });
      if (!patientData) {
        return NextResponse.json(
          { error: "Permiso denegado sobre el paciente" },
          { status: 403 }
        );
      }
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        titulo,
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        patient_id: patient_id || null, // Opcional
        doctor_id: session.user.id,
      },
      include: {
        patient: {
          select: {
            nombre: true,
          }
        }
      }
    });

    return NextResponse.json({ appointment: newAppointment }, { status: 201 });
  } catch (error) {
    console.error("[APPOINTMENTS_POST]", error);
    return NextResponse.json(
      { error: "Lógica interna falló al agendar la cita" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { patient_id, notas, tareas_pendientes, observaciones, fecha_sesion } = await request.json();

    if (!patient_id) {
      return NextResponse.json({ error: "No se proporcionó el paciente" }, { status: 400 });
    }

    // Comprueba que el usuario actual sí sea dueño de ese paciente
    const patientOwnership = await prisma.patient.findFirst({
      where: {
        id: patient_id,
        doctor_id: session.user.id,
      }
    });

    if (!patientOwnership) {
      return NextResponse.json({ error: "Acceso denegado a este paciente" }, { status: 403 });
    }

    const newSession = await prisma.therapySession.create({
      data: {
        patient_id,
        notas: notas || null,
        tareas_pendientes: tareas_pendientes || null,
        observaciones: observaciones || null,
        // Si viene fecha_sesion del cliente (vinculada a una cita), úsala; si no, usa ahora
        fecha_sesion: fecha_sesion ? new Date(fecha_sesion) : new Date(),
      }
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("[SESSIONS_POST]", error);
    return NextResponse.json(
      { error: "Error interno gestionando la sesión" },
      { status: 500 }
    );
  }
}

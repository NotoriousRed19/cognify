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

    const patients = await prisma.patient.findMany({
      where: {
        doctor_id: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ patients }, { status: 200 });
  } catch (error) {
    console.error("[PATIENTS_GET]", error);
    return NextResponse.json(
      { error: "Error de servidor al obtener pacientes" },
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
      nombre,
      identificacion,
      celular,
      fecha_nacimiento,
      sexo,
      nacionalidad,
      historial_medico,
      medicacion,
    } = body;

    // Validación mínima obligatoria
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const newPatient = await prisma.patient.create({
      data: {
        nombre,
        identificacion: identificacion || null,
        celular: celular || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        sexo: sexo || null,
        nacionalidad: nacionalidad || null,
        historial_medico: historial_medico || null,
        medicacion: medicacion || null,

        // Clave foránea: Vinculando el paciente al doctor actual
        doctor: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({ patient: newPatient }, { status: 201 });
  } catch (error) {
    console.error("[PATIENTS_POST]", error);
    return NextResponse.json(
      { error: "Error de servidor al crear paciente" },
      { status: 500 }
    );
  }
}

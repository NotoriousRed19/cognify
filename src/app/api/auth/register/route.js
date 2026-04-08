import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // ── Validaciones básicas ──────────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña son requeridos." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // ── Verifica si el email ya está registrado ───────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Ya existe una cuenta con ese correo electrónico." },
        { status: 409 }
      );
    }

    // ── Hashea la contraseña y crea el usuario ────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        message: "Cuenta creada exitosamente.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}

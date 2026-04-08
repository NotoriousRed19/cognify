import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const now = new Date();

    // ── 1. Total de pacientes ────────────────────────────────────────────────
    const totalPatients = await prisma.patient.count({
      where: { doctor_id: doctorId },
    });

    // ── 2. Citas próximas (hoy en adelante) ─────────────────────────────────
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        fecha_inicio: { gte: now },
      },
      include: {
        patient: { select: { nombre: true } },
      },
      orderBy: { fecha_inicio: "asc" },
      take: 5,
    });

    // ── 3. Pacientes CON al menos una cita próxima ───────────────────────────
    const patientsWithAppointment = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        fecha_inicio: { gte: now },
        patient_id: { not: null },
      },
      select: { patient_id: true },
      distinct: ["patient_id"],
    });
    const withAppointmentCount = patientsWithAppointment.length;
    const withoutAppointmentCount = totalPatients - withAppointmentCount;

    // ── 4. Actividad semanal (citas por día, semana actual) ──────────────────
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Domingo

    const thisWeekAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        fecha_inicio: { gte: weekStart, lte: weekEnd },
      },
      select: { fecha_inicio: true },
    });

    // Agrupar por día (Lun–Dom)
    const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const weeklyData = dayLabels.map((day, i) => {
      const dayDate = addDays(weekStart, i);
      const dayStr = format(dayDate, "yyyy-MM-dd");
      const count = thisWeekAppointments.filter(
        (a) => format(new Date(a.fecha_inicio), "yyyy-MM-dd") === dayStr
      ).length;
      return { day, citas: count };
    });

    // ── 5. Cita de hoy ────────────────────────────────────────────────────────
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayCount = await prisma.appointment.count({
      where: {
        doctor_id: doctorId,
        fecha_inicio: { gte: todayStart, lte: todayEnd },
      },
    });

    // ── 6. Sesiones Completadas (Histórico) ──────────────────────────
    const completedSessionsCount = await prisma.appointment.count({
      where: {
        doctor_id: doctorId,
        estado: "COMPLETADA",
      },
    });

    return NextResponse.json({
      totalPatients,
      withAppointmentCount,
      withoutAppointmentCount,
      todayCount,
      upcomingAppointments,
      weeklyData,
      completedSessionsCount,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error);
    return NextResponse.json({ error: "Error al obtener métricas" }, { status: 500 });
  }
}

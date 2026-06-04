import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";

export async function GET() {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const now = new Date();

    // ── 1. Total de pacientes ────────────────────────────────────────────────
    const { count: totalPatients, error: e1 } = await supabase
      .from("Patient")
      .select('*', { count: 'exact', head: true });

    // ── 2. Citas próximas (hoy en adelante) ─────────────────────────────────
    const { data: upcomingAppointments, error: e2 } = await supabase
      .from("Appointment")
      .select('*, patient:Patient(nombre)')
      .gte("fecha_inicio", now.toISOString())
      .neq("estado", "CANCELADA")
      .neq("estado", "COMPLETADA")
      .neq("status", "REJECTED")
      .order("fecha_inicio", { ascending: true })
      .limit(5);

    // ── 3. Pacientes CON al menos una cita próxima ───────────────────────────
    const { data: patientsWithApptData, error: e3 } = await supabase
      .from("Appointment")
      .select('patient_id')
      .gte("fecha_inicio", now.toISOString())
      .not('patient_id', 'is', null)
      .neq("estado", "CANCELADA")
      .neq("estado", "COMPLETADA")
      .neq("status", "REJECTED")
      .limit(10000);
      
    const uniquePatientIds = new Set((patientsWithApptData || []).map(a => a.patient_id));
    const withAppointmentCount = uniquePatientIds.size;
    const withoutAppointmentCount = (totalPatients || 0) - withAppointmentCount;

    // ── 4. Actividad semanal (citas por día, semana actual) ──────────────────
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const { data: thisWeekAppointments, error: e4 } = await supabase
      .from("Appointment")
      .select("fecha_inicio")
      .gte("fecha_inicio", weekStart.toISOString())
      .lte("fecha_inicio", weekEnd.toISOString())
      .neq("estado", "CANCELADA")
      .neq("status", "REJECTED");

    const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const appointmentsByDay = new Map();
    (thisWeekAppointments || []).forEach((a) => {
      const dayStr = format(new Date(a.fecha_inicio), "yyyy-MM-dd");
      appointmentsByDay.set(dayStr, (appointmentsByDay.get(dayStr) || 0) + 1);
    });
    const weeklyData = dayLabels.map((day, i) => {
      const dayDate = addDays(weekStart, i);
      const dayStr = format(dayDate, "yyyy-MM-dd");
      return { day, citas: appointmentsByDay.get(dayStr) || 0 };
    });

    // ── 5. Cita de hoy (Pendientes) ───────────────────────────────────────────
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { count: todayCount, error: e5 } = await supabase
      .from("Appointment")
      .select('*', { count: 'exact', head: true })
      .gte("fecha_inicio", todayStart.toISOString())
      .lte("fecha_inicio", todayEnd.toISOString())
      .neq("estado", "CANCELADA")
      .neq("estado", "COMPLETADA")
      .neq("status", "REJECTED");

    // ── 6. Sesiones Completadas (Histórico) ──────────────────────────
    const { count: completedSessionsCount, error: e6 } = await supabase
      .from("Appointment")
      .select('*', { count: 'exact', head: true })
      .eq("estado", "COMPLETADA");

    return NextResponse.json({
      totalPatients: totalPatients || 0,
      withAppointmentCount,
      withoutAppointmentCount,
      todayCount: todayCount || 0,
      upcomingAppointments: upcomingAppointments || [],
      weeklyData,
      completedSessionsCount: completedSessionsCount || 0,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error);
    return NextResponse.json({ error: "Error al obtener métricas" }, { status: 500 });
  }
}

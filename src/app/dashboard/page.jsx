"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, CalendarCheck, CalendarX, TrendingUp, UserPlus, CalendarClock, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";

const PatientStatusChart = dynamic(
  () => import("@/Components/molecules/DashboardCharts").then((mod) => mod.PatientStatusChart),
  { ssr: false, loading: () => <div className="w-full h-full bg-muted/20 animate-pulse rounded-xl" /> }
);

const WeeklyActivityChart = dynamic(
  () => import("@/Components/molecules/DashboardCharts").then((mod) => mod.WeeklyActivityChart),
  { ssr: false, loading: () => <div className="w-full h-full bg-muted/20 animate-pulse rounded-xl" /> }
);
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Skeleton de carga para KPIs ──────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <div className="h-3 w-28 bg-muted rounded-full" />
          <div className="h-8 w-16 bg-muted rounded-full" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted" />
      </div>
      <div className="h-3 w-36 bg-muted rounded-full mt-4" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "unauthorized") {
      setShowUnauthorizedAlert(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => {
        setShowUnauthorizedAlert(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial + polling cada 30 segundos para tiempo real
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Datos derivados para gráficos
  const patientStatusData = stats
    ? [
        { name: "Con cita próxima", value: stats.withAppointmentCount, color: "#6366f1" },
        { name: "Sin citas", value: stats.withoutAppointmentCount, color: "#cbd5e1" },
      ]
    : [];

  const retentionPct =
    stats && stats.totalPatients > 0
      ? Math.round((stats.withAppointmentCount / stats.totalPatients) * 100)
      : 0;

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">

      {showUnauthorizedAlert && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-2xl flex items-start gap-3 text-red-700 animate-fade-in relative">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-sm font-bold block">Acceso Denegado</span>
            <p className="text-xs text-red-600/90 mt-0.5 leading-relaxed">
              No cuentas con el rol &quot;Administrador&quot; para acceder a esa sección. Puedes utilizar el simulador de roles en la esquina inferior derecha para alternar tu rol e intentar de nuevo.
            </p>
          </div>
          <button 
            onClick={() => setShowUnauthorizedAlert(false)}
            className="text-red-500 hover:text-red-700 font-bold text-lg absolute top-3 right-4 cursor-pointer leading-none"
            title="Cerrar advertencia"
          >
            &times;
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Resumen General
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Métricas en tiempo real — sincronizadas con pacientes y calendario.
          </p>
        </div>
        {lastUpdated && (
          <button
            onClick={() => { setIsLoading(true); fetchStats(); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizado {format(lastUpdated, "HH:mm:ss")}
          </button>
        )}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {isLoading || !stats ? (
          <>
            <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
          </>
        ) : (
          <>
            {/* Total Pacientes */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pacientes Totales</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{stats.totalPatients}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <Link href="/dashboard/pacientes" className="text-xs text-primary font-medium mt-4 flex items-center gap-1 hover:underline w-fit">
                <TrendingUp className="w-3 h-3" />
                Ver archivo completo
              </Link>
            </div>

            {/* Citas hoy */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Citas Hoy</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{stats.todayCount}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-colors duration-300">
                  <CalendarClock className="w-5 h-5" />
                </div>
              </div>
              <Link href="/dashboard/calendario" className="text-xs text-muted-foreground font-medium mt-4 hover:text-primary hover:underline w-fit transition-colors">
                Ver en calendario
              </Link>
            </div>

            {/* Con cita próxima */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Con Cita Próxima</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{stats.withAppointmentCount}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-4">
                Pacientes agendados activamente
              </p>
            </div>

            {/* Sesiones Completadas */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sesiones Finalizadas</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{stats.completedSessionsCount || 0}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-4">
                Historial de éxito clínico
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Gráficos ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut — Proporción de pacientes */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col h-[350px] lg:h-[400px] hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-foreground mb-4">Estado de Pacientes</h3>
          {isLoading || !stats ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />
            </div>
          ) : stats.totalPatients === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Sin datos todavía
            </div>
          ) : (
            <PatientStatusChart data={patientStatusData} retentionPct={retentionPct} />
          )}
        </div>

        {/* Barras — Actividad semanal */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col h-[350px] lg:h-[400px] hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-foreground mb-4">Actividad Semanal</h3>
          {isLoading || !stats ? (
            <div className="flex-1 flex items-end gap-3 px-4 pb-4">
              {[40, 70, 50, 80, 30, 20, 45].map((h, i) => (
                <div key={i} className="flex-1 bg-muted rounded-t-lg animate-pulse" style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : (
            <WeeklyActivityChart data={stats.weeklyData} />
          )}
        </div>
      </div>

      {/* ── Próximas Citas ────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-lg font-semibold text-foreground">Próximas Citas</h3>
          <Link href="/dashboard/calendario" className="text-sm text-primary font-medium hover:underline">
            Ver calendario →
          </Link>
        </div>

        {isLoading || !stats ? (
          <div className="divide-y divide-border/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-muted rounded-full" />
                  <div className="h-3 w-24 bg-muted rounded-full" />
                </div>
                <div className="h-3 w-20 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : stats?.upcomingAppointments?.length > 0 ? (
          <div className="divide-y divide-border/50">
            {stats.upcomingAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{appt.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {appt.patient?.nombre ?? "Sin paciente asignado"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {format(new Date(appt.fecha_inicio), "d MMM", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(appt.fecha_inicio), "HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-3">
              <CalendarCheck className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No hay citas próximas</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Agenda una nueva cita desde el calendario.</p>
            <Link
              href="/dashboard/calendario"
              className="px-4 py-2 rounded-xl bg-muted text-foreground border border-border hover:bg-muted/80 transition-colors font-medium text-sm"
            >
              Ir al Calendario
            </Link>
          </div>
        )}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md hover:shadow-lg transition-shadow">
        <div>
          <h3 className="text-xl font-bold mb-2">Crear nuevo expediente</h3>
          <p className="text-white/80 text-sm md:text-base max-w-xl">
            Registra a un nuevo paciente hoy mismo. Su expediente aparecerá directamente en el archivo centralizado y las métricas se actualizarán al instante.
          </p>
        </div>
        <Link
          href="/dashboard/pacientes"
          className="whitespace-nowrap px-6 py-3 rounded-xl bg-white text-primary font-bold hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-5 h-5" />
          Añadir paciente
        </Link>
      </div>

    </div>
  );
}

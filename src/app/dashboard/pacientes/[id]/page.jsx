"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, CalendarPlus, Phone, StickyNote,
  Target, Plus, X, FileText, Pill, HeartPulse,
  CalendarCheck2, CalendarX2, CalendarClock, ClipboardList,
  ChevronDown, ChevronUp, AlertCircle, Edit2, Check, Cake, User, Globe, Trash2
} from "lucide-react";
import Link from "next/link";
import { format, isSameDay, isPast, isFuture, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Devuelve la sesión de nota que coincide con la fecha de una cita */
function findSessionForAppointment(sesiones, appointment) {
  return sesiones.find((s) =>
    isSameDay(new Date(s.fecha_sesion), new Date(appointment.fecha_inicio))
  ) || null;
}

// ── Unified Timeline Entry ────────────────────────────────────────────────────

function AppointmentEntry({ appointment, session, upcoming, onAddNote, onDeleteNote }) {
  const [expanded, setExpanded] = useState(false);
  const apptDate = new Date(appointment.fecha_inicio);
  const apptEnd  = new Date(appointment.fecha_fin);
  const past     = isPast(apptEnd) || appointment.estado === "COMPLETADA";

  let statusLabel, statusColor, StatusIcon, cardBorder;
  if (upcoming) {
    statusLabel = "Próxima";
    statusColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
    StatusIcon  = CalendarClock;
    cardBorder  = "border-blue-300/40 hover:border-blue-400/60";
  } else if (past && session) {
    statusLabel = "Completada";
    statusColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    StatusIcon  = CalendarCheck2;
    cardBorder  = "border-emerald-300/40 hover:border-emerald-400/60";
  } else {
    statusLabel = "Sin registro";
    statusColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
    StatusIcon  = CalendarX2;
    cardBorder  = "border-rose-300/30 hover:border-rose-400/50";
  }

  return (
    <div className={`bg-card rounded-2xl border ${cardBorder} shadow-sm transition-all duration-200`}>
      {/* Cabecera de la entrada */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => !upcoming && setExpanded((v) => !v)}
      >
        {/* Ícono de estado */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${statusColor}`}>
          <StatusIcon className="w-5 h-5" />
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{appointment.titulo}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(apptDate, "EEEE d 'de' MMMM yyyy · HH:mm", { locale: es })}
            {" — "}
            {format(apptEnd, "HH:mm", { locale: es })}
          </p>
        </div>

        {/* Badge de estado */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
            {statusLabel}
          </span>
          {/* Expandir si es pasada */}
          {!upcoming && (
            <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Contenido expandido — solo aplica a citas pasadas */}
      {!upcoming && expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-4 space-y-4 relative">
          {session ? (
            <>
              <div className="absolute top-2 right-4 z-10">
                <button
                  onClick={(e) => { e.preventDefault(); onDeleteNote(session.id); }}
                  className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Eliminar nota clínica"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {session.notas && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" /> Notas de Sesión
                  </p>
                  <p className="text-sm text-foreground/85 leading-relaxed bg-muted/30 rounded-xl px-4 py-3 whitespace-pre-wrap">
                    {session.notas}
                  </p>
                </div>
              )}
              {session.tareas_pendientes && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Tareas Asignadas
                  </p>
                  <p className="text-sm text-foreground/85 leading-relaxed bg-amber-50/50 border border-amber-200/40 rounded-xl px-4 py-3 whitespace-pre-wrap">
                    {session.tareas_pendientes}
                  </p>
                </div>
              )}
              {session.observaciones && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Observaciones
                  </p>
                  <p className="text-sm text-foreground/80 italic bg-muted/20 rounded-xl px-4 py-3 whitespace-pre-wrap">
                    {session.observaciones}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="text-sm text-muted-foreground">Esta cita no tiene notas clínicas registradas.</p>
              <button
                onClick={() => onAddNote(appointment)}
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir nota clínica
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Standalone session note (no matching appointment) ─────────────────────────
function StandaloneSessionEntry({ session, index, total, onDeleteNote }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm hover:border-primary/30 transition-all duration-200">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20">
          <StickyNote className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">Sesión {total - index}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(session.fecha_sesion), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-primary/10 text-primary border-primary/20 shrink-0">
          Nota clínica
        </span>
        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-4 space-y-4 relative">
          <div className="absolute top-2 right-4 z-10">
            <button
              onClick={(e) => { e.preventDefault(); onDeleteNote(session.id); }}
              className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Eliminar nota clínica"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {session.notas && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Notas
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed bg-muted/30 rounded-xl px-4 py-3 whitespace-pre-wrap">
                {session.notas}
              </p>
            </div>
          )}
          {session.tareas_pendientes && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Tareas
              </p>
              <p className="text-sm text-foreground/85 bg-amber-50/50 border border-amber-200/40 rounded-xl px-4 py-3 whitespace-pre-wrap">
                {session.tareas_pendientes}
              </p>
            </div>
          )}
          {session.observaciones && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Observaciones
              </p>
              <p className="text-sm text-foreground/80 italic bg-muted/20 rounded-xl px-4 py-3 whitespace-pre-wrap">
                {session.observaciones}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PatientProfilePage() {
  const params   = useParams();
  const router   = useRouter();

  const [patient, setPatient]               = useState(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [activeTab, setActiveTab]           = useState("todas");
  const [preselectedAppt, setPreselectedAppt] = useState(null); // para "Añadir nota clínica"
  
  const [isEditingMedication, setIsEditingMedication] = useState(false);
  const [editableMedication, setEditableMedication] = useState("");
  const [isSavingMedication, setIsSavingMedication] = useState(false);

  const [isEditingHistorial, setIsEditingHistorial] = useState(false);
  const [editableHistorial, setEditableHistorial] = useState("");
  const [isSavingHistorial, setIsSavingHistorial] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    notas: "",
    tareas_pendientes: "",
    observaciones: "",
    fecha_sesion: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchPatientDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPatient(data.patient);
      } else {
        router.push("/dashboard/pacientes");
      }
    } catch (error) {
      console.error("Error fetching patient", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => { fetchPatientDetail(); }, [fetchPatientDetail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSessionForm((prev) => ({ ...prev, [name]: value }));
  };

  const openModalForAppointment = (appointment) => {
    setPreselectedAppt(appointment);
    setSessionForm({
      notas: "",
      tareas_pendientes: "",
      observaciones: "",
      fecha_sesion: format(new Date(appointment.fecha_inicio), "yyyy-MM-dd"),
    });
    setIsSessionModalOpen(true);
  };

  const openModalFresh = () => {
    setPreselectedAppt(null);
    setSessionForm({
      notas: "",
      tareas_pendientes: "",
      observaciones: "",
      fecha_sesion: format(new Date(), "yyyy-MM-dd"),
    });
    setIsSessionModalOpen(true);
  };

  const submitSession = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patient.id,
          notas: sessionForm.notas,
          tareas_pendientes: sessionForm.tareas_pendientes,
          observaciones: sessionForm.observaciones,
          // Evitar que el UTC shift atrase un día la nota agregando las 12 del mediodía en UTC
          fecha_sesion: sessionForm.fecha_sesion ? sessionForm.fecha_sesion + "T12:00:00Z" : undefined,
        }),
      });
      if (res.ok) {
        if (preselectedAppt) {
          // Si había una cita seleccionada, la pasamos a COMPLETADA
          await fetch(`/api/appointments/${preselectedAppt.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "COMPLETADA" })
          });
        }
        await fetchPatientDetail();
        setIsSessionModalOpen(false);
        setPreselectedAppt(null);
        setSessionForm({ notas: "", tareas_pendientes: "", observaciones: "", fecha_sesion: format(new Date(), "yyyy-MM-dd") });
      }
    } catch (error) {
      console.error("Error creating session", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMedication = async () => {
    setIsSavingMedication(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicacion: editableMedication }),
      });
      if (res.ok) {
        await fetchPatientDetail();
        setIsEditingMedication(false);
      }
    } catch (error) {
      console.error("Error saving medication", error);
    } finally {
      setIsSavingMedication(false);
    }
  };

  const handleEditMedicationStart = () => {
    setEditableMedication(patient.medicacion || "");
    setIsEditingMedication(true);
  };

  const handleSaveHistorial = async () => {
    setIsSavingHistorial(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historial_medico: editableHistorial }),
      });
      if (res.ok) {
        await fetchPatientDetail();
        setIsEditingHistorial(false);
      }
    } catch (error) {
      console.error("Error saving historial", error);
    } finally {
      setIsSavingHistorial(false);
    }
  };

  const handleEditHistorialStart = () => {
    setEditableHistorial(patient.historial_medico || "");
    setIsEditingHistorial(true);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta nota clínica? Esta acción no se puede deshacer.")) return;
    
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPatientDetail(); // Refreshes the timeline
      } else {
        alert("Ocurrió un error al intentar eliminar la nota clínica.");
      }
    } catch (error) {
      console.error("Error deleting session", error);
    }
  };

  // ── Unified Timeline Logic ───────────────────────────────────────────────
  const { upcoming, completedWithNotes, withoutNotes, standaloneNotes, stats } = useMemo(() => {
    if (!patient) return { upcoming: [], completedWithNotes: [], withoutNotes: [], standaloneNotes: [], stats: {} };

    const appointments = patient.appointments || [];
    const sesiones     = patient.sesiones || [];

    const upcomingList       = [];
    const completedWithList  = [];
    const withoutList        = [];

    // Track which sesiones were matched to an appointment
    const matchedSessionIds = new Set();

    for (const appt of appointments) {
      const apptEnd   = new Date(appt.fecha_fin);
      const session   = findSessionForAppointment(sesiones, appt);
      if (session) matchedSessionIds.add(session.id);

      const isCompleted = appt.estado === "COMPLETADA";
      const isPastEnd = isPast(apptEnd);

      if (isCompleted || isPastEnd) {
        if (session) {
          completedWithList.push({ appt, session, upcoming: false });
        } else {
          withoutList.push({ appt, session: null, upcoming: false });
        }
      } else {
        // Citas futuras o en curso que no han sido marcadas como completadas
        upcomingList.push({ appt, session: null, upcoming: true });
      }
    }

    // Sesiones que no tienen una cita correspondiente
    const standaloneList = sesiones.filter((s) => !matchedSessionIds.has(s.id));

    return {
      upcoming:          upcomingList.sort((a, b) => new Date(a.appt.fecha_inicio) - new Date(b.appt.fecha_inicio)),
      completedWithNotes: completedWithList,
      withoutNotes:      withoutList,
      standaloneNotes:   standaloneList,
      stats: {
        totalAppts:    appointments.length,
        completed:     completedWithList.length,
        withoutNotes:  withoutList.length,
        upcoming:      upcomingList.length,
      }
    };
  }, [patient]);

  // Build the list for the active tab
  const timelineEntries = useMemo(() => {
    if (activeTab === "proximas")   return upcoming;
    if (activeTab === "completadas") return completedWithNotes;
    if (activeTab === "sin_registro") return withoutNotes;
    // "todas" — sorted chronologically desc
    return [...completedWithNotes, ...withoutNotes, ...upcoming]
      .sort((a, b) => new Date(b.appt.fecha_inicio) - new Date(a.appt.fecha_inicio));
  }, [activeTab, upcoming, completedWithNotes, withoutNotes]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!patient) return null;

  const initials = getInitials(patient.nombre);

  const TABS = [
    { id: "todas",        label: "Todas",         count: stats.totalAppts },
    { id: "proximas",     label: "Próximas",       count: stats.upcoming,    color: "text-blue-600" },
    { id: "completadas",  label: "Completadas",    count: stats.completed,   color: "text-emerald-600" },
    { id: "sin_registro", label: "Sin registro",   count: stats.withoutNotes, color: "text-rose-600" },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 flex flex-col space-y-6 min-h-screen">

      {/* ── Navegación ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/pacientes"
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a pacientes
        </Link>
        <button
          onClick={openModalFresh}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium text-sm"
        >
          <CalendarPlus className="w-4 h-4" />
          Añadir Nota Clínica
        </button>
      </div>

      {/* ── Cabecera — Identidad ─────────────────────────────────────────── */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-soft">
            <span className="text-3xl font-bold text-white tracking-tight">{initials}</span>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-heading font-bold text-foreground">{patient.nombre}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {patient.identificacion && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <FileText className="w-3.5 h-3.5 text-primary/70" />
                  {patient.identificacion}
                </span>
              )}
              {patient.celular && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {patient.celular}
                </span>
              )}
              {patient.fecha_nacimiento && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <Cake className="w-3.5 h-3.5 text-amber-500" />
                  {differenceInYears(new Date(), new Date(patient.fecha_nacimiento))} años
                </span>
              )}
              {patient.sexo && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  {patient.sexo}
                </span>
              )}
              {patient.nacionalidad && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <Globe className="w-3.5 h-3.5 text-cyan-500" />
                  {patient.nacionalidad}
                </span>
              )}
            </div>

            {/* ── Stats de citas ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { label: "Total citas",    value: stats.totalAppts,   color: "text-foreground" },
                { label: "Completadas",    value: stats.completed,    color: "text-emerald-600" },
                { label: "Sin registro",   value: stats.withoutNotes, color: "text-rose-600" },
                { label: "Próximas",       value: stats.upcoming,     color: "text-blue-600" },
              ].map((s) => (
                <div key={s.label} className="bg-muted/30 rounded-xl px-4 py-3 border border-border/40">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Padecimiento ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Padecimiento / Historial</h3>
                </div>
                {!isEditingHistorial && (
                  <button 
                    onClick={handleEditHistorialStart}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50"
                    title="Editar historial"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {isEditingHistorial ? (
                <div className="animate-in fade-in space-y-2">
                  <textarea
                    autoFocus
                    value={editableHistorial}
                    onChange={(e) => setEditableHistorial(e.target.value)}
                    placeholder="Diagnósticos previos, antecedentes relevantes..."
                    className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all resize-none min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setIsEditingHistorial(false)}
                      disabled={isSavingHistorial}
                      className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveHistorial}
                      disabled={isSavingHistorial}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isSavingHistorial ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {patient.historial_medico ? patient.historial_medico.split(",").map((term, i) => (
                    term.trim() && (
                      <span key={i} className="text-xs font-medium bg-rose-500/10 text-rose-700 border border-rose-300/30 px-3 py-1.5 rounded-full">
                        {term.trim()}
                      </span>
                    )
                  )) : (
                    <span className="text-sm text-muted-foreground italic">No hay historial registrado.</span>
                  )}
                </div>
              )}
            </div>

          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-violet-500" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Medicación Actual</h3>
                </div>
                {!isEditingMedication && (
                  <button 
                    onClick={handleEditMedicationStart}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50"
                    title="Editar medicación"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {isEditingMedication ? (
                <div className="animate-in fade-in space-y-2">
                  <textarea
                    autoFocus
                    value={editableMedication}
                    onChange={(e) => setEditableMedication(e.target.value)}
                    placeholder="Ej: Fluoxetina 20mg, Alprazolam 0.5mg..."
                    className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all resize-none min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setIsEditingMedication(false)}
                      disabled={isSavingMedication}
                      className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveMedication}
                      disabled={isSavingMedication}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isSavingMedication ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {patient.medicacion ? patient.medicacion.split(",").map((med, i) => (
                    med.trim() && (
                      <span key={i} className="text-xs font-medium bg-violet-500/10 text-violet-700 border border-violet-300/30 px-3 py-1.5 rounded-full">
                        {med.trim()}
                      </span>
                    )
                  )) : (
                    <span className="text-sm text-muted-foreground italic">No hay medicación registrada.</span>
                  )}
                </div>
              )}
            </div>
        </div>

      {/* ── Línea de tiempo de Citas ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-primary" />
            Historial de Citas y Sesiones
          </h2>
        </div>

        {/* Tabs de filtro */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-white/20" : "bg-muted"
              } ${tab.color || ""}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Entradas del timeline */}
        {timelineEntries.length > 0 ? (
          <div className="space-y-3">
            {timelineEntries.map((entry, idx) => (
              <AppointmentEntry
                key={entry.appt.id || `appt-${idx}`}
                appointment={entry.appt}
                session={entry.session}
                upcoming={entry.upcoming}
                onAddNote={openModalForAppointment}
                onDeleteNote={handleDeleteSession}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <CalendarX2 className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground">Sin citas en esta categoría</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {activeTab === "todas" ? "No hay citas registradas para este paciente en el calendario." : "Prueba con otra categoría."}
            </p>
          </div>
        )}

        {/* Notas clínicas sin cita asociada */}
        {standaloneNotes.length > 0 && (
          <div className="space-y-3 mt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              Notas clínicas sin cita asociada
            </p>
            {standaloneNotes.map((session, i) => (
              <StandaloneSessionEntry
                key={session.id}
                session={session}
                index={i}
                total={standaloneNotes.length}
                onDeleteNote={handleDeleteSession}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Nueva Nota Clínica ─────────────────────────────────────── */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsSessionModalOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-card shadow-2xl border-l border-border/50 animate-in slide-in-from-right flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
                  <StickyNote className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading">Nota Clínica</h2>
                  <p className="text-xs text-muted-foreground">
                    {preselectedAppt ? `Cita: ${preselectedAppt.titulo}` : `Para ${patient.nombre}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="sessionForm" onSubmit={submitSession} className="space-y-5">

                {/* Fecha — editable solo si no hay cita preseleccionada */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Fecha de la sesión
                    {preselectedAppt && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        Vinculada al calendario
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    name="fecha_sesion"
                    value={sessionForm.fecha_sesion}
                    onChange={handleInputChange}
                    readOnly={!!preselectedAppt}
                    className={`w-full px-4 py-2.5 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                      preselectedAppt ? "bg-muted/50 cursor-default" : "bg-muted/30"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                  <span className="w-1.5 h-4 bg-gradient-primary rounded-full" />
                  <h3 className="text-xs font-bold text-foreground tracking-widest uppercase">Contenido de la sesión</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Notas de Terapia</label>
                  <textarea
                    name="notas"
                    rows={5}
                    placeholder="Sintomatología, desarrollo de la cita, técnicas aplicadas..."
                    value={sessionForm.notas}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Tareas Asignadas</label>
                  <textarea
                    name="tareas_pendientes"
                    rows={3}
                    placeholder="Ej. Respiración diafragmática 3 veces por semana..."
                    value={sessionForm.tareas_pendientes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Observaciones
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-normal">Opcional</span>
                  </label>
                  <textarea
                    name="observaciones"
                    rows={2}
                    placeholder="Anotaciones extra, recordatorios..."
                    value={sessionForm.observaciones}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border/50 bg-muted/10 shrink-0">
              <button
                form="sessionForm"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                ) : (
                  <><StickyNote className="w-5 h-5" /> Guardar Nota Clínica</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

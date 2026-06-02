"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, FilePlus, Search, X, Loader2, Phone,
  IdCard, CalendarDays, ArrowRight, UserRoundX, Trash2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Genera iniciales a partir del nombre completo */
function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Paleta de colores para el avatar — usa el índice para consistencia */
const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-600",
  "bg-blue-500/20 text-blue-600",
  "bg-emerald-500/20 text-emerald-600",
  "bg-rose-500/20 text-rose-600",
  "bg-amber-500/20 text-amber-600",
  "bg-cyan-500/20 text-cyan-600",
  "bg-fuchsia-500/20 text-fuchsia-600",
  "bg-indigo-500/20 text-indigo-600",
];

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function PatientCardSkeleton() {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 w-36 bg-muted rounded-full" />
        <div className="h-3 w-24 bg-muted rounded-full" />
      </div>
      <div className="hidden md:flex flex-col gap-2 items-end">
        <div className="h-3 w-28 bg-muted rounded-full" />
        <div className="h-3 w-20 bg-muted rounded-full" />
      </div>
    </div>
  );
}

// ── Patient Card ──────────────────────────────────────────────────────────────
function PatientCard({ patient, index, onDelete }) {
  const initials = getInitials(patient.nombre);
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const joinDate = format(new Date(patient.createdAt), "d MMM yyyy", { locale: es });

  return (
    <Link
      href={`/dashboard/pacientes/${patient.id}`}
      className="group bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-xl font-bold text-lg flex items-center justify-center shrink-0 ${avatarColor} group-hover:scale-105 transition-transform duration-200`}>
        {initials}
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
          {patient.nombre}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {patient.identificacion && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <IdCard className="w-3 h-3" />
              {patient.identificacion}
            </span>
          )}
          {patient.celular && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              {patient.celular}
            </span>
          )}
          {!patient.identificacion && !patient.celular && (
            <span className="text-xs text-muted-foreground/60 italic">Sin datos de contacto</span>
          )}
        </div>
      </div>

      {/* Meta + acción */}
      <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Eliminar paciente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            Ver ficha
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="w-3 h-3" />
          {joinDate}
        </span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PacientesPage() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitError, setSubmitError] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    identificacion: "",
    celular: "",
    fecha_nacimiento: "",
    sexo: "",
    nacionalidad: "",
    historial_medico: "",
    medicacion: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (res.ok) setPatients(data.patients || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleDeletePatient = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${nombre}? Esta acción no se puede deshacer y borrará todas sus citas y notas asociadas.`)) return;
    
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPatients();
      } else {
        alert("Ocurrió un error al intentar eliminar el paciente.");
      }
    } catch (error) {
      console.error("Failed to delete patient:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === "identificacion") {
      newValue = value.replace(/[^0-9]/g, "");
    } else if (name === "celular") {
      newValue = value.replace(/[^0-9+]/g, "");
    }
    
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchPatients();
        setIsModalOpen(false);
        setFormData({ nombre: "", identificacion: "", celular: "", fecha_nacimiento: "", sexo: "", nacionalidad: "", historial_medico: "", medicacion: "" });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setSubmitError(errorData.error || "Ocurrió un error al intentar guardar el paciente.");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      setSubmitError("Ocurrió un error de red al intentar guardar el paciente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.identificacion && p.identificacion.includes(searchQuery)) ||
      (p.celular && p.celular.includes(searchQuery))
  );

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500 min-h-screen flex flex-col gap-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-card rounded-2xl border border-border/50 shadow-sm p-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white shrink-0 shadow-soft">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Archivo de Pacientes
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isLoading ? "Cargando..." : `${patients.length} paciente${patients.length !== 1 ? "s" : ""} registrado${patients.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, ID o celular..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setSubmitError(null);
              setIsModalOpen(true);
            }}
            className="flex shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl bg-gradient-primary text-white font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 items-center gap-2 text-sm"
          >
            <FilePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Expediente</span>
          </button>
        </div>
      </div>

      {/* ── Lista de Pacientes ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3">

        {/* Subheader de resultados */}
        {!isLoading && searchQuery && (
          <p className="text-sm text-muted-foreground px-1">
            {filteredPatients.length > 0
              ? `${filteredPatients.length} resultado${filteredPatients.length !== 1 ? "s" : ""} para "${searchQuery}"`
              : `Sin resultados para "${searchQuery}"`}
          </p>
        )}

        {isLoading ? (
          // Skeletons
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <PatientCardSkeleton key={i} />)}
          </div>
        ) : filteredPatients.length > 0 ? (
          // Cards
          <div className="flex flex-col gap-3">
            {filteredPatients.map((patient, index) => (
              <PatientCard key={patient.id} patient={patient} index={index} onDelete={() => handleDeletePatient(patient.id, patient.nombre)} />
            ))}
          </div>
        ) : patients.length === 0 ? (
          // Empty — sin ningún paciente
          <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center text-center p-16 min-h-[400px]">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-5 shadow-soft">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">
              Aún no hay pacientes
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Comienza creando el expediente de tu primer paciente. Solo toma unos segundos.
            </p>
            <button
              onClick={() => {
                setSubmitError(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              Crear primer expediente
            </button>
          </div>
        ) : (
          // Sin resultados de búsqueda
          <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center text-center p-16 min-h-[300px]">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <UserRoundX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Ningún paciente coincide
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Prueba con otro nombre, ID o número de celular.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-primary hover:underline font-medium"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Lateral ─────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-card shadow-2xl border-l border-border/50 animate-in slide-in-from-right flex flex-col">

            {/* Header del panel */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
                  <FilePlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading text-foreground">Nuevo Expediente</h2>
                  <p className="text-xs text-muted-foreground">Completa los datos del paciente</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {submitError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium animate-in fade-in zoom-in-95 duration-200">
                  {submitError}
                </div>
              )}
              <form id="patientForm" onSubmit={handleSubmit} className="space-y-6">

                {/* Datos Personales */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <span className="w-1.5 h-4 bg-gradient-primary rounded-full" />
                    <h3 className="text-xs font-bold text-foreground tracking-widest uppercase">
                      Datos Personales
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">
                      Nombres y Apellidos <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="nombre"
                      placeholder="Ej: María García López"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Identificación</label>
                      <input
                        type="text"
                        name="identificacion"
                        placeholder="CC / Pasaporte"
                        value={formData.identificacion}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Celular</label>
                      <input
                        type="tel"
                        name="celular"
                        placeholder="+57 300 000 0000"
                        value={formData.celular}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Fecha Nacimiento</label>
                      <input
                        type="date"
                        name="fecha_nacimiento"
                        value={formData.fecha_nacimiento}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Sexo</label>
                      <select
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Nacionalidad</label>
                      <select
                        name="nacionalidad"
                        value={formData.nacionalidad}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Boliviana">Boliviana</option>
                        <option value="Chilena">Chilena</option>
                        <option value="Colombiana">Colombiana</option>
                        <option value="Costarricense">Costarricense</option>
                        <option value="Cubana">Cubana</option>
                        <option value="Dominicana">Dominicana</option>
                        <option value="Ecuatoriana">Ecuatoriana</option>
                        <option value="Española">Española</option>
                        <option value="Guatemalteca">Guatemalteca</option>
                        <option value="Hondureña">Hondureña</option>
                        <option value="Mexicana">Mexicana</option>
                        <option value="Nicaragüense">Nicaragüense</option>
                        <option value="Panameña">Panameña</option>
                        <option value="Paraguaya">Paraguaya</option>
                        <option value="Peruana">Peruana</option>
                        <option value="Salvadoreña">Salvadoreña</option>
                        <option value="Uruguaya">Uruguaya</option>
                        <option value="Venezolana">Venezolana</option>
                        <option value="Otra">Otra</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Historial Clínico */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <span className="w-1.5 h-4 bg-gradient-primary rounded-full" />
                    <h3 className="text-xs font-bold text-foreground tracking-widest uppercase">
                      Historial Clínico
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Historial Médico</label>
                    <textarea
                      name="historial_medico"
                      rows={4}
                      placeholder="Diagnósticos previos, antecedentes relevantes..."
                      value={formData.historial_medico}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                      Medicación actual
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-normal">Opcional</span>
                    </label>
                    <input
                      type="text"
                      name="medicacion"
                      placeholder="Ej: Fluoxetina 20mg, Alprazolam 0.5mg..."
                      value={formData.medicacion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

              </form>
            </div>

            {/* Footer con botón */}
            <div className="p-5 border-t border-border/50 bg-muted/10 shrink-0">
              <button
                form="patientForm"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando expediente...
                  </>
                ) : (
                  <>
                    <FilePlus className="w-5 h-5" />
                    Guardar Expediente
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

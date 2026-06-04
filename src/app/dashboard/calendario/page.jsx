"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addMonths, subMonths, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isSameMonth, isSameDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarPlus, Loader2, X, Clock, User, Trash2, Pencil, CheckCircle2 } from "lucide-react";

// Selector personalizado UX 12-Horas (AM/PM)
const TimeSelect12h = ({ name, value, onChange }) => {
  const parse24to12 = (val24) => {
    if (!val24) return { h: "12", m: "00", ampm: "AM" };
    const parts = val24.split(":");
    if (parts.length !== 2) return { h: "12", m: "00", ampm: "AM" };
    let hInt = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = hInt >= 12 ? "PM" : "AM";
    if (hInt === 0) hInt = 12;
    if (hInt > 12) hInt -= 12;
    return { h: hInt.toString().padStart(2, "0"), m, ampm };
  };

  const { h, m, ampm } = parse24to12(value);

  const handleUpdate = (newH, newM, newAmpm) => {
    let hInt = parseInt(newH, 10);
    if (newAmpm === "PM" && hInt < 12) hInt += 12;
    if (newAmpm === "AM" && hInt === 12) hInt = 0;
    const finalH = hInt.toString().padStart(2, "0");
    onChange({ target: { name, value: `${finalH}:${newM}` } });
  };

  return (
    <div className="flex bg-muted/30 border border-border/50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all divide-x divide-border/50 h-[42px]">
      <select 
        value={h} 
        onChange={(e) => handleUpdate(e.target.value, m, ampm)}
        className="w-full px-1 py-2 bg-transparent text-sm focus:outline-none cursor-pointer text-center"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const val = (i + 1).toString().padStart(2, "0");
          return <option key={val} value={val}>{val}</option>;
        })}
      </select>
      <select 
        value={m} 
        onChange={(e) => handleUpdate(h, e.target.value, ampm)}
        className="w-full px-1 py-2 bg-transparent text-sm focus:outline-none cursor-pointer text-center"
      >
        {["00", "15", "30", "45"].map((val) => (
          <option key={val} value={val}>{val}</option>
        ))}
      </select>
      <select 
        value={ampm} 
        onChange={(e) => handleUpdate(h, m, e.target.value)}
        className="w-full px-1 py-2 bg-primary/10 text-primary text-sm focus:outline-none cursor-pointer font-bold text-center"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [calendarView, setCalendarView] = useState("month"); // "month", "week", "day"
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("agenda"); // "agenda" | "create" | "edit"
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [selectedDateForAgenda, setSelectedDateForAgenda] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    patient_id: "",
    fecha: format(new Date(), "yyyy-MM-dd"), // para el input type date
    hora_inicio: "10:00",
    hora_fin: "11:00"
  });
  const [submitError, setSubmitError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        // Transformar strings a Dates para que date-fns trabaje limpio
        const parsed = (data.appointments || []).map(appt => ({
          ...appt,
          // Aseguramos que el string se procese como UTC puro añadiendo T y Z
          fecha_inicio: new Date(appt.fecha_inicio.replace(' ', 'T') + (appt.fecha_inicio.includes('Z') ? '' : 'Z')),
          fecha_fin: new Date(appt.fecha_fin.replace(' ', 'T') + (appt.fecha_fin.includes('Z') ? '' : 'Z'))
        }));
        setAppointments(parsed);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  const handlePrevMonth = () => {
    if (calendarView === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (calendarView === "week") setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addDays(currentDate, -1));
  };
  
  const handleNextMonth = () => {
    if (calendarView === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (calendarView === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    
    const inicioStr = `${formData.fecha}T${formData.hora_inicio}:00`;
    const finStr = `${formData.fecha}T${formData.hora_fin}:00`;

    // Validar que la cita no sea en el pasado
    const selectedDate = new Date(inicioStr);
    if (selectedDate < new Date()) {
      setSubmitError("No se pueden agendar citas en el pasado.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        titulo: formData.titulo,
        // Convertir la hora local (inicioStr sin Z) a UTC enviando el formato ISO
        fecha_inicio: new Date(inicioStr).toISOString(),
        fecha_fin: new Date(finStr).toISOString(),
      };
      
      if (formData.patient_id) {
        payload.patient_id = formData.patient_id;
      }

      const url = modalMode === "edit" ? `/api/appointments/${selectedApptId}` : "/api/appointments";
      const method = modalMode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchAppointments(); 
        setModalMode("agenda");
        if (modalMode !== "edit") {
           setFormData(prev => ({ ...prev, titulo: "", patient_id: "" }));
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setSubmitError(errorData.error || "Fallo al guardar cita");
      }
    } catch (error) {
      console.error("Server error", error);
      setSubmitError("Error de conexión al guardar la cita");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayClick = (cloneDay) => {
    setSubmitError(null);
    setSelectedDateForAgenda(cloneDay);
    setModalMode("agenda");
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (appt) => {
    setSubmitError(null);
    setSelectedApptId(appt.id);
    if (appt.status === "PENDING_APPROVAL") {
      setModalMode("review");
      setFormData({
        titulo: appt.titulo,
        patient_id: "",
        fecha: format(appt.fecha_inicio, "yyyy-MM-dd"),
        hora_inicio: format(appt.fecha_inicio, "HH:mm"),
        hora_fin: format(appt.fecha_fin, "HH:mm"),
        guest_details: appt.guest_details,
        guest_name: appt.guest_name,
        guest_contact: appt.guest_contact
      });
    } else {
      setModalMode("edit");
      setFormData({
        titulo: appt.titulo,
        patient_id: appt.patient_id || "",
        fecha: format(appt.fecha_inicio, "yyyy-MM-dd"),
        hora_inicio: format(appt.fecha_inicio, "HH:mm"),
        hora_fin: format(appt.fecha_fin, "HH:mm")
      });
    }
    setIsModalOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cita?")) return;
    try {
      const res = await fetch(`/api/appointments/${selectedApptId}`, { method: "DELETE" });
      if (res.ok) {
        setModalMode("agenda");
        fetchAppointments();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert("Fallo al eliminar cita: " + (errorData.error || "Error desconocido"));
      }
    } catch (error) {
      console.error(error);
      alert("Error de red al intentar eliminar la cita");
    }
  };

  const handleToggleCompleted = async (appt) => {
    const newStatus = appt.estado === "COMPLETADA" ? "AGENDADA" : "COMPLETADA";
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newStatus })
      });
      if (res.ok) fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewAction = async (actionStatus) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/appointments/${selectedApptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionStatus })
      });
      if (res.ok) {
        setModalMode("agenda");
        setIsModalOpen(false);
        fetchAppointments();
        fetchPatients();
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "Error al procesar la cita");
      }
    } catch (error) {
      setSubmitError("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función constructora del Grid de Días (Matriz de 7x5, 1x7, o 1x1)
  const renderCells = () => {
    let startDate, endDate;
    if (calendarView === "month") {
      startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    } else if (calendarView === "week") {
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      startDate = currentDate;
      endDate = currentDate;
    }

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const iterCount = calendarView === "day" ? 1 : 7;
    
    while (day <= endDate) {
      for (let i = 0; i < iterCount; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        // Filtrar citas que pertenecen a este día
        const dayAppointments = appointments.filter(appt => {
          if (!isSameDay(appt.fecha_inicio, cloneDay)) return false;
          if (!showCompleted && appt.estado === "COMPLETADA") return false;
          return true;
        });

        // Determinar Estilos de la Celda
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div 
            key={day} 
            onClick={() => handleDayClick(cloneDay)}
            className={`min-h-[120px] p-2 md:p-3 relative group cursor-pointer transition-colors duration-200
              ${calendarView === "day" ? "h-full min-h-[400px]" : "border-r border-b border-border/50"}
              ${!isCurrentMonth && calendarView === "month" ? "bg-muted/10 text-muted-foreground/30 pointer-events-none" : "bg-card hover:bg-muted/20 text-foreground"}
              ${isToday ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center 
                ${isToday ? "bg-primary text-primary-foreground shadow-sm" : (isCurrentMonth || calendarView !== "month") ? "group-hover:text-primary transition-colors" : ""}`}>
                {formattedDate}
              </span>
            </div>

            <div className={`mt-2 flex overflow-hidden ${calendarView === "day" ? "flex-col gap-2.5" : "flex-wrap gap-1.5"}`}>
              {dayAppointments.sort((a, b) => a.fecha_inicio - b.fecha_inicio).map(appt => {
                const isPatientAppt = Boolean(appt.patient_id);
                const isCompleted = appt.estado === "COMPLETADA";
                const isPending = appt.status === "PENDING_APPROVAL";
                
                let borderColorClass = isPatientAppt ? 'border-l-violet-500' : 'border-l-emerald-500';
                let bgTintClass = isPatientAppt ? 'bg-violet-500' : 'bg-emerald-500';
                
                if (isPending) {
                  borderColorClass = 'border-l-orange-500 border-dashed';
                  bgTintClass = 'bg-orange-500';
                }

                if (calendarView === "day") {
                  return (
                    <div 
                      key={appt.id} 
                      className={`relative overflow-hidden p-3 rounded-xl border border-border/50 border-l-4 shadow-sm flex items-center justify-between gap-3 transition-all cursor-default bg-card ${borderColorClass}`}
                    >
                      {/* Ambient Tint */}
                      <div className={`absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none ${bgTintClass}`} />
                      
                      <div className="relative z-10 flex flex-col gap-1 w-full pl-1">
                        <div className="flex items-center justify-between w-full">
                           <h4 className={`font-bold text-sm text-foreground ${isCompleted ? 'opacity-70' : ''}`}>
                             {appt.titulo} {isPending && <span className="text-orange-500 ml-1 text-xs uppercase bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">Pendiente</span>}
                           </h4>
                           <div className="flex gap-1.5">
                             {!isPending && (
                               <button
                                 onClick={(e) => { e.stopPropagation(); handleToggleCompleted(appt); }}
                                 className={`p-1.5 shrink-0 shadow-sm border border-border/50 rounded-lg transition-colors ${isCompleted ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-background text-muted-foreground/60 hover:text-emerald-500'}`}
                               >
                                 <CheckCircle2 className="w-3.5 h-3.5" />
                               </button>
                             )}
                           </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1 text-[11px] text-muted-foreground font-medium mt-1">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {format(appt.fecha_inicio, "h:mm a")} - {format(appt.fecha_fin, "h:mm a")}</span>
                          {isPatientAppt && <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {appt.patient?.nombre}</span>}
                          {isPending && <span className="flex items-center gap-1.5 text-orange-600"><User className="w-3 h-3" /> {appt.guest_name}</span>}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Vista Mes o Semana
                return (
                  <div 
                    key={appt.id} 
                    className={`w-2.5 h-2.5 rounded-full shadow-sm hover:scale-125 transition-transform ${isCompleted ? 'bg-muted-foreground opacity-50' : isPending ? 'bg-orange-500' : isPatientAppt ? 'bg-violet-500' : 'bg-emerald-500'}`}
                    title={appt.titulo}
                  />
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day} className={`grid w-full ${calendarView === "day" ? "grid-cols-1 flex-1" : "grid-cols-7"}`}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500 min-h-screen flex flex-col">
      
      {/* Header del Calendario */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-6 gap-4">
        
        <div className="flex flex-col">
          <h1 className="text-2xl font-heading font-bold text-foreground capitalize flex items-center gap-2">
            <span className="text-primary">{format(currentDate, "MMMM", { locale: es })}</span>
            <span>{format(currentDate, "yyyy")}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organiza tus consultas y actividades del mes.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          
          {/* Controles de Vista */}
          <div className="flex bg-muted/50 rounded-xl p-1 border border-border/50">
            <button onClick={() => setCalendarView("month")} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${calendarView === "month" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>Mes</button>
            <button onClick={() => setCalendarView("week")} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${calendarView === "week" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>Semana</button>
            <button onClick={() => setCalendarView("day")} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${calendarView === "day" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>Día</button>
          </div>

          {/* Navegación de tiempo */}
          <div className="flex bg-muted/50 rounded-xl p-1 border border-border/50">
            <button 
              onClick={handlePrevMonth}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-background rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-background rounded-lg transition-all"
            >
              Hoy
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-background rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${showCompleted ? 'bg-muted border-border/80 text-foreground' : 'bg-background hover:bg-muted/50 text-muted-foreground border-border/50'}`}
            >
              <CheckCircle2 className="w-4 h-4"/>
              <span className="hidden lg:inline">{showCompleted ? "Ocultar Completadas" : "Mostrar Completadas"}</span>
            </button>

            <button 
              onClick={() => {
                setModalMode("create");
                setSelectedApptId(null);
                setSubmitError(null);
                setFormData({ 
                  titulo: "", patient_id: "", 
                  fecha: format(new Date(), "yyyy-MM-dd"), 
                  hora_inicio: "10:00", hora_fin: "11:00" 
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-white font-medium hover:shadow-lg transition-all duration-300 whitespace-nowrap text-sm"
            >
              <CalendarPlus className="w-4 h-4"/>
              <span className="hidden sm:inline">Nueva Cita</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cuadrícula del Calendario */}
      <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Cabecera de los Días */}
            {calendarView !== "day" && (
              <div className="grid grid-cols-7 w-full border-b border-border/50 bg-muted/30">
                {daysOfWeek.map((dayName, idx) => (
                  <div key={idx} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border/50 last:border-r-0">
                    {dayName}
                  </div>
                ))}
              </div>
            )}
            
            {calendarView === "day" && (
              <div className="py-3 text-center text-xs font-bold text-primary uppercase tracking-wider border-b border-border/50 bg-muted/30 w-full">
                {format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
              </div>
            )}
            {/* Celdas del Mes */}
            <div className="flex flex-col flex-1 border-l border-t border-border/50 -ml-px -mt-px relative z-10 w-full overflow-x-auto">
              <div className="min-w-[700px] w-full">
                {renderCells()}
              </div>
            </div>
          </>
        )}
      </div>


      {/* Modal Lateral (Creación Cita) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative w-full max-w-md h-full bg-card shadow-2xl border-l border-border/50 animate-in slide-in-from-right flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/50 bg-muted/10 shrink-0">
              <div>
                <h2 className="text-xl font-bold font-heading">
                  {modalMode === "agenda" 
                    ? `Agenda: ${format(selectedDateForAgenda, "d 'de' MMMM", { locale: es })}`
                    : modalMode === "create" ? "Agendar Cita" : "Detalles de Cita"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {modalMode === "agenda"
                    ? "Resumen de las actividades programadas para este día."
                    : modalMode === "create" ? "Configura un nuevo espacio en agenda." : "Edita o elimina este espacio."}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === "agenda" ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                { appointments.filter(a => isSameDay(a.fecha_inicio, selectedDateForAgenda) && (showCompleted || a.estado !== "COMPLETADA")).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground/50 flex flex-col items-center">
                     <CalendarPlus className="w-12 h-12 mb-3 opacity-20" />
                     <p className="text-sm font-medium">No hay citas {showCompleted ? "" : "pendientes "}para este día.</p>
                  </div>
                ) : (
                  appointments.filter(a => isSameDay(a.fecha_inicio, selectedDateForAgenda) && (showCompleted || a.estado !== "COMPLETADA"))
                  .sort((a, b) => a.fecha_inicio - b.fecha_inicio)
                  .map(appt => {
                      const isPatientAppt = Boolean(appt.patient_id);
                      const isCompleted = appt.estado === "COMPLETADA";
                      const isPending = appt.status === "PENDING_APPROVAL";
                         
                      return (
                         <div key={appt.id} className={`p-4 rounded-xl border border-l-4 shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all bg-card border-border/50 hover:shadow-md ${isPending ? 'border-l-orange-500' : isPatientAppt ? 'border-l-violet-500' : 'border-l-emerald-500'}`}>
                            {/* Ambient Tint */}
                            <div className={`absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none ${isPending ? 'bg-orange-500' : isPatientAppt ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                            
                            <div className="flex justify-between items-start gap-4 relative z-10">
                              <div className="flex-1">
                                <h3 className={`font-bold text-base leading-tight text-foreground ${isCompleted ? 'opacity-60' : ''}`}>
                                  {appt.titulo} {isPending && <span className="text-orange-500 ml-1 text-[10px] uppercase bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">Pendiente</span>}
                                </h3>
                                <div className="text-[13px] text-muted-foreground flex flex-col gap-2 mt-3">
                                  <p className="flex items-center gap-2 font-medium">
                                    <span className={`p-1.5 rounded-lg shadow-sm ${isPending ? 'bg-orange-500/10 text-orange-600' : isPatientAppt ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                      <Clock className="w-3.5 h-3.5" /> 
                                    </span>
                                    {format(appt.fecha_inicio, "h:mm a")} - {format(appt.fecha_fin, "h:mm a")}
                                  </p>
                                  {appt.patient && (
                                     <p className="flex items-center gap-2 font-medium">
                                       <span className="p-1.5 rounded-lg shadow-sm bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                          <User className="w-3.5 h-3.5" />
                                       </span>
                                       {appt.patient.nombre}
                                     </p>
                                  )}
                                  {isPending && (
                                     <p className="flex items-center gap-2 font-medium text-orange-600">
                                       <span className="p-1.5 rounded-lg shadow-sm bg-orange-500/10 text-orange-600">
                                          <User className="w-3.5 h-3.5" />
                                       </span>
                                       {appt.guest_name}
                                     </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                {!isPending && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleCompleted(appt); }}
                                    className={`p-2 shadow-sm border rounded-xl transition-colors ${isCompleted ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-background text-muted-foreground/60 border-border/50 hover:text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10'}`}
                                    title={isCompleted ? "Desmarcar" : "Marcar completada"}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleAppointmentClick(appt)} 
                                  className={`p-2 shrink-0 bg-background shadow-sm border border-border/50 rounded-xl hover:bg-muted transition-colors ${isPending ? 'text-orange-500 border-orange-200 hover:bg-orange-50 hover:border-orange-300' : 'text-muted-foreground hover:text-foreground'}`}
                                  title={isPending ? "Revisar" : "Editar"}
                                >
                                  {isPending ? <CheckCircle2 className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                         </div>
                      )
                  })
                )}
                
                <button 
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      titulo: "", patient_id: "", 
                      fecha: format(selectedDateForAgenda, "yyyy-MM-dd"), 
                      hora_inicio: "10:00", hora_fin: "11:00" 
                    }));
                    setSelectedApptId(null);
                    setSubmitError(null);
                    setModalMode("create");
                  }}
                  className="w-full flex items-center justify-center py-3.5 mt-4 rounded-xl border border-dashed border-primary/50 text-primary hover:bg-primary/5 font-bold transition-all"
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Nueva Cita
                </button>
              </div>
            ) : modalMode === "review" ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <h3 className="font-bold text-orange-900 mb-1">Solicitud de Reserva</h3>
                    <p className="text-sm text-orange-800">
                      Un paciente quiere agendar una cita el <strong>{formData.fecha}</strong> a las <strong>{formData.hora_inicio}</strong>.
                      Verifica que el pago haya sido recibido antes de aprobar la cita.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 border-b pb-2">Datos del Paciente</h4>
                    <ul className="text-sm space-y-2 text-slate-700">
                      <li><strong>Nombre:</strong> {formData.guest_details?.nombre} {formData.guest_details?.apellido}</li>
                      <li><strong>Cédula / Identidad:</strong> {formData.guest_details?.identificacion}</li>
                      <li><strong>Teléfono / WhatsApp:</strong> {formData.guest_details?.celular}</li>
                      <li><strong>Nacionalidad:</strong> {formData.guest_details?.nacionalidad}</li>
                      <li><strong>Nacimiento:</strong> {formData.guest_details?.fecha_nacimiento}</li>
                    </ul>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium text-center">
                      {submitError}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border/50 bg-muted/10 shrink-0 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleReviewAction("REJECTED")}
                    className="flex items-center justify-center py-3 px-4 rounded-xl border border-rose-500 text-rose-600 hover:bg-rose-50 font-bold transition-all disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleReviewAction("CONFIRMED")}
                    className="flex items-center justify-center py-3 px-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aprobar Cita"}
                  </button>
                </div>
              </div>
            ) : (
              <>
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <form id="appointmentForm" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                  <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Asunto o Título *
                  </label>
                  <input 
                    required
                    name="titulo"
                    placeholder="Ej: Terapia Regular, Entrevista Inicial..."
                    value={formData.titulo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Paciente (Opcional)
                  </label>
                  <select
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Selecciona un paciente del archivo...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <hr className="border-border/50" />

                <div className="space-y-4">
                  <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-sm font-medium text-muted-foreground">Fecha Elegida</label>
                    <input 
                      required
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Inicio
                      </label>
                      <TimeSelect12h 
                        name="hora_inicio"
                        value={formData.hora_inicio}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Fin
                      </label>
                      <TimeSelect12h 
                        name="hora_fin"
                        value={formData.hora_fin}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium text-center">
                    {submitError}
                  </div>
                )}

              </form>
            </div>
              <div className={`p-4 border-t border-border/50 bg-muted/10 shrink-0 ${modalMode === "edit" ? "grid grid-cols-2 gap-3" : "grid grid-cols-[auto_1fr] gap-3"}`}>
                 <button type="button" onClick={() => setModalMode("agenda")} className={`flex items-center justify-center py-3 px-4 rounded-xl border border-border/60 hover:bg-muted font-medium transition-all`}>
                    Cancelar
                 </button>
                 {modalMode === "edit" && false /* Deletion handled strictly on form ? Wait, actually user might expect Delete here */}
                 
                 {modalMode === "edit" ? (
                    <div className="flex gap-2 w-full">
                        <button
                          type="button"
                          onClick={handleDeleteAppointment}
                          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition-all duration-300"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span className="hidden sm:inline">Borrar</span>
                        </button>
                        <button 
                          form="appointmentForm"
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center py-3 rounded-xl bg-gradient-primary text-white font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                        </button>
                    </div>
                 ) : (
                    <button 
                      form="appointmentForm"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center py-3 rounded-xl bg-gradient-primary text-white font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Creando..." : "Confirmar Agenda"}
                    </button>
                 )}
              </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

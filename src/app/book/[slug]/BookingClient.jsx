"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  User, 
  CreditCard,
  AlertCircle,
  Loader2,
  ArrowRight,
  Brain
} from "lucide-react";
import Link from "next/link";

export default function BookingClient({ doctor }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    identificacion: "",
    celular: "",
    nacionalidad: "",
    fecha_nacimiento: "",
    sexo: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Generar próximos 14 días
  const nextDays = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));
  }, []);

  // Cargar slots cuando cambia la fecha
  useEffect(() => {
    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedTime("");
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(`/api/booking/${doctor.slug}/slots?date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error(err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedDate, doctor.slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 2) {
      setStep(3); // Pasar al pago
      return;
    }

    if (step === 3) {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`/api/booking/${doctor.slug}/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: format(selectedDate, "yyyy-MM-dd"),
            time: selectedTime,
            ...formData
          })
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Ocurrió un error");
          setSubmitting(false);
        } else {
          setStep(4); // Success
        }
      } catch (err) {
        setError("Error de conexión");
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (step === 4) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="w-full bg-background/80 backdrop-blur-md border-b border-border/50 py-4 px-6 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center shadow-soft">
              <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-brand-gradient font-bold text-lg cursor-pointer">
              Cognify
            </p>
          </Link>
          </div>
        </header>

        <main className="flex-1 w-full flex items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center py-16 px-8 max-w-lg w-full bg-card rounded-[2.5rem] shadow-elevated border border-border/50 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-8 ring-8 ring-primary/5">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight text-center mb-4">
              ¡Solicitud <span className="text-brand-gradient">Enviada!</span>
            </h1>
            <p className="text-muted-foreground text-center mb-10 text-lg leading-relaxed">
              Tu cita está pendiente de aprobación por el Dr. {doctor.name}. Te notificaremos pronto.
            </p>
            <Link 
              href="/" 
              className="w-full text-center px-8 py-4 bg-brand-gradient text-white rounded-2xl font-semibold hover:opacity-90 hover:shadow-lg transition-all"
            >
              Volver al Inicio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Premium */}
      <header className="w-full bg-background/80 backdrop-blur-md border-b border-border/50 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center shadow-soft">
              <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-brand-gradient font-bold text-lg cursor-pointer">
              Cognify
            </p>
          </Link>
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border/50 shadow-sm">
            Agendando con <span className="text-foreground font-semibold">Dr. {doctor.name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        {/* Progress Bar Premium */}
        <div className="mb-14 w-full max-w-xl mx-auto flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-muted rounded-full -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-brand-gradient rounded-full -z-10 transition-all duration-700 ease-in-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          {[1, 2, 3].map(s => {
            const isActive = step === s;
            const isCompleted = step > s;
            
            return (
              <div 
                key={s} 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-sm ${
                  isActive ? 'bg-primary text-white ring-4 ring-background scale-110 shadow-soft' : 
                  isCompleted ? 'bg-primary text-white ring-4 ring-background' : 
                  'bg-card text-muted-foreground ring-4 ring-background border border-border'
                }`}
              >
                {s === 1 && <Calendar className="w-5 h-5" />}
                {s === 2 && <User className="w-5 h-5" />}
                {s === 3 && <CreditCard className="w-5 h-5" />}
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-[2.5rem] border border-border/60 shadow-elevated overflow-hidden max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <form onSubmit={handleSubmit} className="p-8 md:p-12">
            
            {/* STEP 1: FECHA Y HORA */}
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight mb-3">Elige tu horario</h2>
                  <p className="text-muted-foreground text-lg">Selecciona el día y la hora de tu preferencia.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-foreground uppercase tracking-wider">1. Selecciona un día</label>
                  <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x px-1">
                    {nextDays.map((date, i) => {
                      const isSelected = isSameDay(date, selectedDate);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          className={`flex flex-col items-center justify-center p-4 w-[80px] shrink-0 rounded-2xl border transition-all duration-300 snap-center ${
                            isSelected 
                              ? 'border-primary bg-primary text-white shadow-soft scale-105' 
                              : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground'
                          }`}
                        >
                          <span className={`text-xs font-medium uppercase mb-1.5 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                            {format(date, "EEE", { locale: es })}
                          </span>
                          <span className="text-2xl font-bold font-heading">
                            {format(date, "d")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    2. Selecciona la hora
                    {loadingSlots && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  </label>
                  
                  {!loadingSlots && slots.length === 0 ? (
                    <div className="p-8 bg-muted/30 border border-border/50 rounded-2xl text-center">
                      <p className="text-muted-foreground">No hay horarios disponibles este día.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {slots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`p-3.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                            selectedTime === slot
                              ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!selectedTime}
                  onClick={() => setStep(2)}
                  className="w-full py-4.5 bg-brand-gradient text-white rounded-2xl font-bold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 text-lg shadow-soft"
                >
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 2: DATOS PERSONALES */}
            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-start gap-4">
                  <button type="button" onClick={handleBack} className="p-2.5 mt-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight mb-2">Tus Datos</h2>
                    <p className="text-muted-foreground text-lg">Requeridos para abrir tu expediente.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground">Nombre</label>
                      <input 
                        required type="text"
                        className="w-full p-4 bg-muted/40 border border-border/80 rounded-xl focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50"
                        value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground">Apellido</label>
                      <input 
                        required type="text"
                        className="w-full p-4 bg-muted/40 border border-border/80 rounded-xl focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50"
                        value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground">Cédula / Identificación</label>
                    <input 
                      required type="text"
                      className="w-full p-4 bg-muted/40 border border-border/80 rounded-xl focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50"
                      value={formData.identificacion} onChange={e => setFormData({...formData, identificacion: e.target.value.replace(/[^0-9]/g, "")})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground">Celular (WhatsApp)</label>
                      <input 
                        required type="tel"
                        className="w-full p-4 bg-muted/40 border border-border/80 rounded-xl focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50"
                        value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value.replace(/[^0-9+]/g, "")})}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground">Nacionalidad</label>
                      <select 
                        required
                        className="w-full p-4 bg-muted/40 border border-border/80 rounded-xl focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground appearance-none"
                        value={formData.nacionalidad} onChange={e => setFormData({...formData, nacionalidad: e.target.value})}
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

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground">Fecha de Nacimiento</label>
                      <input 
                        required type="date"
                        className="w-full p-4 bg-muted/40 border border-border/80 rounded-xl focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                        value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground">Sexo</label>
                      <select 
                        required
                        className="w-full p-4 bg-muted/40 border border-border/80 rounded-xl focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground appearance-none"
                        value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4.5 bg-brand-gradient text-white rounded-2xl font-bold hover:opacity-90 transition-all duration-300 shadow-soft flex items-center justify-center gap-2 text-lg"
                >
                  Proceder al Pago <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 3: PAGO */}
            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-start gap-4">
                  <button type="button" onClick={handleBack} className="p-2.5 mt-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight mb-2">Instrucciones de Pago</h2>
                    <p className="text-muted-foreground text-lg">Sigue las instrucciones para finalizar.</p>
                  </div>
                </div>

                <div className="p-8 bg-muted/30 border border-border/50 rounded-2xl whitespace-pre-wrap text-[15px] text-foreground leading-relaxed font-mono shadow-inner">
                  {doctor.payment_instructions || "El especialista no ha proporcionado instrucciones de pago. Puedes enviar la solicitud y se comunicarán contigo."}
                </div>

                <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <p className="text-[15px] text-primary/90 leading-relaxed font-medium">
                    Al confirmar, tu solicitud será enviada. Una vez el especialista verifique el pago, aprobará la cita.
                  </p>
                </div>

                {error && (
                  <div className="p-5 bg-destructive/10 text-destructive text-[15px] font-medium rounded-2xl border border-destructive/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4.5 bg-brand-gradient text-white rounded-2xl font-bold hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-3 shadow-soft disabled:opacity-50 disabled:grayscale text-lg"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar Solicitud"}
                </button>
              </div>
            )}

          </form>
        </div>
      </main>
    </div>
  );
}

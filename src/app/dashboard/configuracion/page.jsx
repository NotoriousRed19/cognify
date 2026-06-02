"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Link as LinkIcon, Plus, Trash2, AlertCircle } from "lucide-react";

const DAYS_OF_WEEK = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    booking_enabled: true,
    payment_instructions: ""
  });
  const [availability, setAvailability] = useState([]);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await fetch("/api/dashboard/configuracion");
      if (res.ok) {
        const { user, availability: avail } = await res.json();
        if (user) {
          setFormData({
            slug: user.slug || "",
            booking_enabled: user.booking_enabled ?? true,
            payment_instructions: user.payment_instructions || ""
          });
        }
        if (avail) {
          setAvailability(avail);
        }
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleAddSlot = (dayIdx) => {
    setAvailability([...availability, { day_of_week: dayIdx, start_time: "09:00", end_time: "17:00" }]);
  };

  const handleRemoveSlot = (index) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index, field, value) => {
    const newAvail = [...availability];
    newAvail[index][field] = value;
    setAvailability(newAvail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuggestions([]);
    setSuccessMsg("");

    // Limpiar slug para evitar espacios o caracteres extraños
    const cleanSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');

    const res = await fetch("/api/dashboard/configuracion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        slug: cleanSlug,
        availability
      })
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === "slug_in_use") {
        setError(data.message);
        setSuggestions(data.suggestions || []);
      } else {
        setError(data.error || "Ocurrió un error al guardar la configuración.");
      }
    } else {
      setSuccessMsg("¡Configuración guardada exitosamente!");
      setFormData(prev => ({ ...prev, slug: cleanSlug }));
    }
    setSaving(false);
  };

  const applySuggestion = (sug) => {
    setFormData(prev => ({ ...prev, slug: sug }));
    setError(null);
    setSuggestions([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex items-center gap-4 bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-6 mt-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Configuración de Reservas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personaliza tu portal público, horarios e instrucciones de pago.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Sección Perfil Público */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/10">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" /> Perfil Público
            </h2>
          </div>
          <div className="p-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-sm text-foreground">Activar reservas web</label>
                <p className="text-xs text-muted-foreground">Permite a los pacientes agendar citas desde tu enlace público.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.booking_enabled}
                  onChange={(e) => setFormData({...formData, booking_enabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="pt-2">
              <label className="font-semibold text-sm text-foreground mb-1 block">Nombre de Enlace (Slug)</label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg border border-border/50 w-full sm:w-auto text-center sm:text-left overflow-x-auto whitespace-nowrap">
                  cognify.app/book/
                </span>
                <input 
                  type="text" 
                  required
                  placeholder="ej. dr-mauricio"
                  className="flex-1 w-full p-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                />
              </div>
              
              {error && (
                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-rose-600 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                  {suggestions.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Sugerencias disponibles: 
                      <div className="flex flex-wrap gap-2 mt-1">
                        {suggestions.map(s => (
                          <button 
                            key={s} 
                            type="button"
                            onClick={() => applySuggestion(s)}
                            className="px-2 py-1 bg-background border border-border rounded-md text-xs hover:border-primary hover:text-primary transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <label className="font-semibold text-sm text-foreground mb-1 block">Instrucciones y Métodos de Pago</label>
              <p className="text-xs text-muted-foreground mb-2">Estas instrucciones se mostrarán al paciente al momento de reservar su cita.</p>
              <textarea 
                rows={4}
                className="w-full p-3 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 custom-scrollbar"
                placeholder="Ej. Pago móvil: CI 1234567, Banco Banesco, Tel 0414-1234567. Zelle: pagos@doctor.com"
                value={formData.payment_instructions}
                onChange={(e) => setFormData({...formData, payment_instructions: e.target.value})}
              />
            </div>

          </div>
        </div>

        {/* Sección Horarios */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/10">
            <h2 className="font-bold text-foreground">Horarios de Atención</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Define los bloques de horas en los que estás disponible cada día.
            </p>
          </div>
          <div className="p-6">
            
            {DAYS_OF_WEEK.map((day, idx) => {
              const daySlots = availability.filter(a => a.day_of_week === idx);
              
              return (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center py-4 border-b border-border/50 gap-4 last:border-0">
                  <div className="w-full sm:w-32 font-medium text-sm text-foreground shrink-0">
                    {day}
                  </div>
                  
                  <div className="flex-1 w-full space-y-2">
                    {daySlots.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">Cerrado / No disponible</span>
                    ) : (
                      daySlots.map((slot, i) => {
                        const globalIndex = availability.indexOf(slot);
                        return (
                          <div key={globalIndex} className="flex items-center gap-2">
                            <input 
                              type="time" 
                              required
                              value={slot.start_time.slice(0,5)} 
                              onChange={(e) => handleSlotChange(globalIndex, "start_time", e.target.value)}
                              className="p-1.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input 
                              type="time" 
                              required
                              value={slot.end_time.slice(0,5)} 
                              onChange={(e) => handleSlotChange(globalIndex, "end_time", e.target.value)}
                              className="p-1.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveSlot(globalIndex)}
                              className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors ml-2"
                              title="Eliminar bloque"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleAddSlot(idx)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Añadir hora
                  </button>
                </div>
              );
            })}

          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl text-center text-sm font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? (
               <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

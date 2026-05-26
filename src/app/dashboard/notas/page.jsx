"use client";

import { StickyNote, Calendar, Clock, Search, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import NotesEditor from "@/Components/molecules/NotesEditor";

export default function NotasPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("notas"); // "notas", "tareas", "observaciones"
  const supabase = createClient();

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("TherapySession")
        .select(`
          id,
          fecha_sesion,
          notas,
          tareas_pendientes,
          observaciones,
          updatedAt,
          Patient!inner (
            id,
            nombre
          )
        `)
        .order("fecha_sesion", { ascending: false });

      if (!error && data) {
        setSessions(data);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [supabase]);

  const handleSaveField = async (field, htmlContent) => {
    if (!selectedSession) return;
    
    const { error } = await supabase
      .from("TherapySession")
      .update({ [field]: htmlContent, updatedAt: new Date().toISOString() })
      .eq("id", selectedSession.id);

    if (!error) {
      // Update local state
      setSessions(prev => 
        prev.map(s => s.id === selectedSession.id ? { ...s, [field]: htmlContent, updatedAt: new Date().toISOString() } : s)
      );
      // Also update selectedSession so if we switch tabs back and forth it has the latest
      setSelectedSession(prev => ({ ...prev, [field]: htmlContent, updatedAt: new Date().toISOString() }));
    }
  };

  const filteredSessions = sessions.filter(session => 
    session.Patient?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat('es-ES', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    }).format(new Date(dateString));
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto h-[calc(100vh-(--spacing(20)))] animate-in fade-in zoom-in-95 duration-500 flex flex-col">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-6 shrink-0 gap-4 mt-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <StickyNote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Notas de Sesión
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Registro clínico y evolución de tus pacientes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar de Sesiones */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 bg-card rounded-2xl border border-border/50 shadow-sm p-4 h-full shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-transparent focus:bg-muted/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-2">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground text-sm">
                No se encontraron sesiones.
              </div>
            ) : (
              filteredSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSelectedSession(session);
                    setActiveTab("notas");
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 border flex items-center justify-between group ${
                    selectedSession?.id === session.id 
                      ? 'bg-primary/5 border-primary/20 shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50'
                  }`}
                >
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {session.Patient?.nombre || 'Paciente Desconocido'}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(session.fecha_sesion)}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                    selectedSession?.id === session.id ? 'text-primary' : 'text-muted-foreground/30 group-hover:text-muted-foreground/60'
                  }`} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Área del Editor */}
        <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {selectedSession ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border/50 bg-muted/10 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold">
                    {selectedSession.Patient?.nombre?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">
                      {selectedSession.Patient?.nombre}
                    </h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      Sesión del {formatDate(selectedSession.fecha_sesion)}
                    </p>
                  </div>
                </div>
                
                {selectedSession.updatedAt && (
                  <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1 bg-muted px-2 py-1 rounded-md border border-border/50">
                    <Clock className="w-3 h-3" /> Editado: {formatDate(selectedSession.updatedAt)}
                  </span>
                )}
              </div>

              {/* TABS */}
              <div className="flex border-b border-border/50 px-4 bg-muted/5 gap-4">
                {[
                  { id: "notas", label: "Notas Clínicas" },
                  { id: "tareas_pendientes", label: "Tareas Pendientes" },
                  { id: "observaciones", label: "Observaciones" }
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id 
                        ? "border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <NotesEditor 
                  key={`${selectedSession.id}-${activeTab}`}
                  initialContent={selectedSession[activeTab] || ""} 
                  onSave={(content) => handleSaveField(activeTab, content)} 
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/10">
              <div className="w-16 h-16 bg-card shadow-sm rounded-full flex items-center justify-center border border-border/50 mb-4">
                <StickyNote className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Ninguna sesión seleccionada</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Selecciona una sesión de la lista lateral para visualizar o editar sus notas clínicas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

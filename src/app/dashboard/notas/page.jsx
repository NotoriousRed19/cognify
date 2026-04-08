"use client";

import { StickyNote, Download } from "lucide-react";

export default function NotasPage() {
  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex justify-between items-center bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8 mt-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <StickyNote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Notas e Insights
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Registro rápido y notas clínicas de tus pacientes.
            </p>
          </div>
        </div>
        
        <button className="hidden md:flex whitespace-nowrap px-6 py-2.5 rounded-xl bg-card border border-border shadow-sm text-foreground hover:bg-muted/50 font-medium transition-all duration-300 items-center gap-2">
          <Download className="w-4 h-4"/>
          Exportar
        </button>
      </div>

      <div className="flex flex-col items-center justify-center text-center p-12 py-24 border-2 border-dashed border-border rounded-3xl bg-muted/30">
        <div className="w-20 h-20 bg-card shadow-sm rounded-full flex items-center justify-center border border-border/50 mb-6">
          <StickyNote className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Sección en construcción</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Próximamente podrás adjuntar documentos, escribir bitácoras privadas y guardar diagnósticos de tus sesiones.
        </p>
      </div>

    </div>
  );
}

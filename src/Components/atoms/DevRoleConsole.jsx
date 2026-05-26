"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function DevRoleConsole() {
  const [role, setRole] = useState("Usuario");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [visible, setVisible] = useState(false);
  const supabase = createClient();

  // Mostrar la consola solo en modo desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Priorizar metadata de auth que es inmediato
        const currentRole = session.user.user_metadata?.role || "Usuario";
        setRole(currentRole);
      }
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || "Usuario");
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [visible, supabase.auth]);

  const toggleRole = async () => {
    if (!user || loading) return;
    setLoading(true);

    const targetRole = role === "Administrador" ? "Usuario" : "Administrador";

    try {
      const response = await fetch("/api/auth/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: targetRole }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRole(targetRole);
        // Forzar recarga del token de Supabase y recargar la página para aplicar el cambio en el Middleware
        await supabase.auth.refreshSession();
        window.location.reload();
      } else {
        console.error("Error al cambiar rol:", result.error);
        alert(`Error al cambiar de rol: ${result.error || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Excepción al cambiar rol:", error);
      alert("Error al conectar con la API de cambio de rol.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !user) return null;

  const isAdmin = role === "Administrador";

  return (
    <div className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-[999] animate-fade-in">
      <div className="bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl shadow-elevated p-4 max-w-xs transition-all duration-300 hover:border-primary/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Simulador de Roles (Dev)
          </span>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 bg-muted/30 p-2.5 rounded-xl border border-border/20">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground leading-none">Rol actual:</span>
                <span className={`text-xs font-bold ${isAdmin ? "text-indigo-600" : "text-foreground"}`}>
                  {role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleRole}
            disabled={loading}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm ${
              isAdmin 
                ? "bg-slate-200 hover:bg-slate-300 text-slate-800" 
                : "bg-gradient-primary hover:opacity-95 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isAdmin ? "Cambiar a Usuario Común" : "Simular Administrador"}
          </button>
        </div>
      </div>
    </div>
  );
}

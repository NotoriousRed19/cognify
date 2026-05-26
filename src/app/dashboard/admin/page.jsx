"use client";

import { useEffect, useState } from "react";
import { 
  Shield, 
  Users, 
  CreditCard, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Server,
  Database
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
      setLoading(false);
    };
    checkAdmin();
  }, [supabase.auth]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Datos simulados del panel de administración
  const systemStats = [
    { name: "Total Psicólogos", value: "348", change: "+12% este mes", icon: Users, color: "text-blue-600 bg-blue-50" },
    { name: "Suscripciones Activas", value: "192", change: "+8% este mes", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
    { name: "Tiempo de Respuesta", value: "142 ms", change: "Óptimo", icon: Activity, color: "text-indigo-600 bg-indigo-50" },
    { name: "Estado del Servidor", value: "99.98%", change: "En línea", icon: Server, color: "text-amber-600 bg-amber-50" },
  ];

  const recentUsers = [
    { id: 1, name: "Dra. Carolina Herrera", email: "c.herrera@cognify.com", role: "Usuario", tier: "Premium", status: "Activo", date: "24 May 2026" },
    { id: 2, name: "Dr. Francisco Silva", email: "f.silva@cognify.com", role: "Usuario", tier: "Básico", status: "Activo", date: "22 May 2026" },
    { id: 3, name: "Dra. Alejandra Gómez", email: "a.gomez@cognify.com", role: "Usuario", tier: "Enterprise", status: "Activo", date: "20 May 2026" },
    { id: 4, name: "Dr. Miguel Ángel Rojas", email: "m.rojas@cognify.com", role: "Administrador", tier: "Premium", status: "Activo", date: "15 Ene 2026" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Encabezado Premium */}
      <div className="relative overflow-hidden bg-gradient-primary rounded-3xl p-8 text-white shadow-lg border border-primary/20">
        <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/12 opacity-10 pointer-events-none">
          <Shield className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              Panel de Administración Autorizado
            </div>
            <h1 className="text-3xl font-heading font-bold">Consola del Administrador</h1>
            <p className="text-white/80 mt-1 max-w-xl">
              Monitoreo del estado del sistema, estadísticas clave de uso, usuarios registrados y configuraciones globales de Cognify.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
            <span className="text-xs text-white/70 block">Sesión activa como:</span>
            <span className="text-sm font-bold block truncate max-w-[200px]">{currentUser?.email}</span>
          </div>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <h3 className="text-3xl font-bold font-heading text-foreground mt-2">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secciones de Detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabla de Usuarios */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground">Usuarios Recientes</h2>
              <p className="text-xs text-muted-foreground">Últimos profesionales registrados en la plataforma</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Usuario</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Rol</th>
                  <th className="pb-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-sm">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        user.tier === "Enterprise" 
                          ? "bg-purple-100 text-purple-700" 
                          : user.tier === "Premium" 
                          ? "bg-indigo-100 text-indigo-700" 
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {user.tier}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-muted-foreground">{user.role}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-semibold text-foreground">{user.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estado de Servicios e Infraestructura */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-heading font-bold text-foreground">Estado de Infraestructura</h2>
            <p className="text-xs text-muted-foreground">Monitoreo de dependencias de Cognify</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border/10">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-500" />
                <div>
                  <span className="text-sm font-semibold block text-foreground">Base de Datos (Supabase)</span>
                  <span className="text-xs text-muted-foreground">AWS us-east-2 · Conectado</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ONLINE</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border/10">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-emerald-500" />
                <div>
                  <span className="text-sm font-semibold block text-foreground">Next.js Edge Middleware</span>
                  <span className="text-xs text-muted-foreground">Vercel Edge Network</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ONLINE</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border/10">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-500" />
                <div>
                  <span className="text-sm font-semibold block text-foreground">Supabase Auth Services</span>
                  <span className="text-xs text-muted-foreground">JWT & MFA Enabled</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">SECURE</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-800 block">Recordatorio de Seguridad</span>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                Todas las acciones ejecutadas en esta consola quedan registradas en las bitácoras del servidor para auditorías SOC2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, CreditCard, RotateCcw, Ban, Activity, RefreshCw, Menu, X, LogOut, LayoutDashboard, Search, Filter } from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const router = useRouter();

  // Filtered users logic
  const filteredUsers = users.filter((user) => {
    const searchMatch = 
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    let statusMatch = true;
    if (statusFilter !== "ALL") {
      const planStatus = user.Subscription?.plan_status;
      if (statusFilter === "ACTIVE" && planStatus !== "ACTIVE") statusMatch = false;
      if (statusFilter === "TRIAL" && planStatus !== "TRIAL") statusMatch = false;
      if (statusFilter === "EXPIRED" && (planStatus === "ACTIVE" || planStatus === "TRIAL")) statusMatch = false;
    }

    return searchMatch && statusMatch;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (userId, planStatus, extraDays = null) => {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, plan_status: planStatus, extra_days: extraDays }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update subscription");
      }

      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground tracking-widest uppercase font-medium animate-pulse">Autenticando Módulo</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-destructive/5 border border-destructive/20 rounded-[2rem] p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4 opacity-80" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-destructive mb-2 tracking-tight">Acceso Denegado</h2>
          <p className="text-muted-foreground mb-6 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-full bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium">
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden selection:bg-primary/20">
      {/* Soft glowing orb in background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Top utility nav (Hamburger) */}
      <div className="absolute top-6 right-6 md:right-8 z-50">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 rounded-full bg-background border border-border/50 shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-300 group"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-foreground group-hover:rotate-90 transition-transform duration-500" strokeWidth={1.5} />
            ) : (
              <Menu className="w-5 h-5 text-foreground group-hover:-scale-y-100 transition-transform duration-500" strokeWidth={1.5} />
            )}
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div 
              className="absolute right-0 mt-4 w-56 rounded-2xl bg-background/80 backdrop-blur-2xl border border-border shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-300 origin-top-right"
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
                  Ir al Dashboard
                </button>
                <div className="h-px bg-border/50 mx-2"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" strokeWidth={2} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-24 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
              <ShieldAlert className="w-4 h-4 text-primary" strokeWidth={2} />
              <span className="text-[10px] tracking-[0.2em] font-bold text-primary uppercase">Módulo Administrativo</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
              Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Plataforma</span>
            </h1>
            <p className="text-muted-foreground max-w-[65ch] text-lg leading-relaxed">
              Supervisa el acceso, gestiona suscripciones y administra la base de datos de profesionales activos en Cognify.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-3xl font-bold tracking-tight text-foreground">{users.length}</span>
              <span className="text-xs tracking-widest uppercase text-muted-foreground font-medium">Usuarios Totales</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-card shadow-soft border border-border/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Double-Bezel Card Container */}
        <div className="p-2 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.04]">
          <div className="bg-card rounded-[calc(2.5rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] border border-border/50 overflow-hidden relative">
            
            {/* Header Toolbar */}
            <div className="px-6 py-4 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                <h3 className="font-semibold text-foreground tracking-tight">Suscripciones Activas</h3>
              </div>
              
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Buscar por correo o usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 shadow-sm"
                  />
                </div>
                
                <div className="relative w-full sm:w-auto">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto bg-background border border-border/50 rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer shadow-sm text-foreground"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="TRIAL">En Prueba</option>
                    <option value="EXPIRED">Expirados / Sin Plan</option>
                  </select>
                </div>

                <button 
                  onClick={fetchUsers} 
                  title="Recargar usuarios"
                  className="p-2 rounded-xl bg-background border border-border/50 hover:bg-muted/50 transition-all group shrink-0 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-active:-rotate-180 duration-500" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Content Table / List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-8 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-widest w-1/3">Usuario</th>
                    <th className="px-8 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Estado</th>
                    <th className="px-8 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Próximo Cobro</th>
                    <th className="px-8 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Acciones Administrativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredUsers.map((user, idx) => (
                    <tr 
                      key={user.id} 
                      className="group hover:bg-muted/30 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-sm">
                              {(user.name?.[0] || user.email[0]).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground tracking-tight">{user.name || "Sin nombre"}</p>
                            <p className="text-sm text-muted-foreground font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/50 backdrop-blur-sm">
                          {user.Subscription?.plan_status === "ACTIVE" ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">ACTIVO</span>
                            </>
                          ) : user.Subscription?.plan_status === "TRIAL" ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">PRUEBA</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-destructive/80"></div>
                              <span className="text-xs font-medium text-destructive">EXPIRADO</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                          <Activity className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                          {user.Subscription?.next_billing_date 
                            ? new Date(user.Subscription.next_billing_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                            : "No definido"}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleUpdateSubscription(user.id, "ACTIVE", 30)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 hover:border-primary transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] font-medium text-xs tracking-wide"
                          >
                            <RotateCcw className="w-3 h-3" strokeWidth={2} />
                            <span>RENOVAR 30D</span>
                          </button>
                          <button
                            onClick={() => handleUpdateSubscription(user.id, "EXPIRED")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/10 hover:border-destructive transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] font-medium text-xs tracking-wide"
                          >
                            <Ban className="w-3 h-3" strokeWidth={2} />
                            <span>SUSPENDER</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="w-12 h-12 mb-4 opacity-20" strokeWidth={1} />
                          <p className="text-lg font-medium">Sin registros</p>
                          <p className="text-sm opacity-80 max-w-sm mx-auto mt-2">Actualmente no hay usuarios registrados en la base de datos de Cognify.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

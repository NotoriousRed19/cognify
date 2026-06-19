"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  ShieldAlert, 
  Users, 
  CreditCard, 
  RotateCcw, 
  Ban, 
  Activity, 
  RefreshCw, 
  Search, 
  Filter 
} from "lucide-react";

const supabase = createClient();

/**
 * Componente de la Consola de Administración (AdminPage).
 * 
 * Propósito:
 * Proporcionar una interfaz restringida para que el administrador de la plataforma
 * pueda gestionar los usuarios registrados (doctores), ver el estado de sus suscripciones
 * y ejecutar acciones manuales (renovar o suspender planes).
 * 
 * Flujo de ejecución y lógica:
 * 1. Inicialización: Utiliza `useState` para el listado de usuarios, estado de carga, errores y filtros.
 * 2. Autenticación (`checkAdmin` en `useEffect`):
 *    - Comprueba si hay una sesión activa. Si no, redirige al `/login`.
 *    - Verifica si el usuario actual tiene privilegios de administrador (por su metadato de rol
 *      o validando un correo especial en su defecto). Si no lo es, redirige al `/dashboard`.
 * 3. Carga de datos (`fetchUsers`):
 *    - Ejecuta un GET a `/api/admin/users`. Si hay un 403, muestra un mensaje de acceso denegado.
 * 4. Interacción de gestión (`handleUpdateSubscription`):
 *    - Ejecuta un PATCH a `/api/admin/subscriptions` enviando el `user_id`, el nuevo estado 
 *      (`plan_status`) y días extra si aplica. Al finalizar, recarga la lista.
 * 5. Filtros y Búsqueda:
 *    - Filtra en el cliente la lista de usuarios recuperada por nombre, correo o estado 
 *      del plan (`ACTIVE`, `TRIAL`, `EXPIRED`), facilitando el análisis visual.
 * 6. Renderizado: Muestra la consola con indicadores (usuarios registrados), buscador, selector de 
 *    estado y la tabla principal interactiva.
 * 
 * @returns {JSX.Element} La vista completa del administrador (o la pantalla de carga/error).
 */
export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // Usar admin@cognify.com como email admin por defecto
        const adminEmail = "admin@cognify.com";
        const userRole = session.user.user_metadata?.role || "Usuario";
        const isEmailAdmin = session.user.email?.toLowerCase() === adminEmail.toLowerCase();
        const isAdmin = userRole === "Administrador" || isEmailAdmin;

        if (!isAdmin) {
          router.push("/dashboard?error=unauthorized");
          return;
        }

        setCurrentUser(session.user);
        await fetchUsers();
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    checkAdmin();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Acceso denegado. Se requieren privilegios de administrador.");
        }
        throw new Error("Error al obtener la lista de usuarios.");
      }
      const data = await res.json();
      setUsers(data.users || []);
      setError(null);
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
        throw new Error(errData.error || "Error al actualizar la suscripción.");
      }

      // Volver a cargar la lista de usuarios para ver los cambios en tiempo real
      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-medium animate-pulse">Cargando Consola...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center mt-12 bg-destructive/5 border border-destructive/20 rounded-3xl p-8">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4 opacity-80" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-destructive mb-2 tracking-tight">Acceso Restringido</h2>
        <p className="text-muted-foreground mb-6 text-sm">{error}</p>
        <button onClick={fetchUsers} className="px-6 py-2.5 rounded-full bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium">
          Reintentar Conexión
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Encabezado Premium */}
      <div className="relative overflow-hidden bg-gradient-primary rounded-3xl p-8 text-white shadow-lg border border-primary/20">
        <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/12 opacity-10 pointer-events-none">
          <ShieldAlert className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Módulo de Control de Suscripciones
            </div>
            <h1 className="text-3xl font-heading font-bold">Consola de Plataforma</h1>
            <p className="text-white/80 mt-1 max-w-xl text-sm leading-relaxed">
              Monitoreo de suscripciones en tiempo real. Modifica planes de acceso, suspende cuentas de forma inmediata o renueva periodos de uso de profesionales registrados.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold tracking-tight">{users.length}</span>
              <span className="text-[10px] tracking-widest uppercase text-white/70 font-medium">Usuarios Registrados</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor de Gestión de Suscripciones */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden relative">
        {/* Barra de Herramientas y Filtros */}
        <div className="px-6 py-4 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="font-semibold text-foreground tracking-tight text-sm md:text-base">Suscripciones Profesionales</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 shadow-sm"
              />
            </div>
            
            {/* Filtro por estado */}
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-background border border-border/50 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm text-foreground"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="TRIAL">En Prueba</option>
                <option value="EXPIRED">Expirados / Sin Plan</option>
              </select>
            </div>

            {/* Botón recargar */}
            <button 
              onClick={fetchUsers} 
              title="Recargar usuarios"
              className="p-2 rounded-xl bg-background border border-border/50 hover:bg-muted/50 transition-all group shrink-0 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-active:-rotate-180 duration-500" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border/50 bg-muted/5">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest w-1/3">Usuario</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Siguiente Renovación</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Acciones Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-sm">
              {filteredUsers.map((user, idx) => {
                const planStatus = user.Subscription?.plan_status;
                const nextBillingDate = user.Subscription?.next_billing_date;
                const trialEndsAt = user.Subscription?.trial_ends_at;

                return (
                  <tr 
                    key={user.id} 
                    className="group hover:bg-muted/20 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary/20 to-accent/20 border border-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-xs">
                            {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                          </span>
                        </div>
                        <div className="truncate max-w-[200px]">
                          <p className="font-semibold text-foreground tracking-tight truncate">{user.name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-background/50 backdrop-blur-sm text-xs font-medium">
                        {planStatus === "ACTIVE" ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <span className="text-emerald-700">ACTIVO</span>
                          </>
                        ) : planStatus === "TRIAL" ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                            <span className="text-amber-700">PRUEBA</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-destructive/80"></span>
                            <span className="text-destructive">EXPIRADO</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium text-xs">
                      {planStatus === "TRIAL" && trialEndsAt ? (
                        <div className="flex flex-col">
                          <span>Final de prueba:</span>
                          <span className="font-semibold text-foreground">{new Date(trialEndsAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      ) : nextBillingDate ? (
                        <span className="text-foreground">{new Date(nextBillingDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      ) : (
                        "No establecido"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleUpdateSubscription(user.id, "ACTIVE", 30)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 hover:border-primary transition-all duration-300 active:scale-[0.96] font-medium text-xs cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Renovar 30D</span>
                        </button>
                        <button
                          onClick={() => handleUpdateSubscription(user.id, "EXPIRED")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/10 hover:border-destructive transition-all duration-300 active:scale-[0.96] font-medium text-xs cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Suspender</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users className="w-10 h-10 mb-2 opacity-25" strokeWidth={1.5} />
                      <p className="text-sm font-semibold">Sin registros de usuarios</p>
                      <p className="text-xs opacity-75 mt-1 max-w-xs mx-auto">No se encontraron profesionales que coincidan con la búsqueda o el filtro actual.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

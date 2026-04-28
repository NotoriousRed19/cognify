"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { 
  Brain, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  StickyNote
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft-pattern flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const navigationOptions = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
    { name: "Calendario", href: "/dashboard/calendario", icon: Calendar },
    { name: "Notas de sesión", href: "/dashboard/notas", icon: StickyNote },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft-pattern">
      {/* Sidebar (Desktop) / Menú fijo izquierdo */}
      <aside 
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border/50 shadow-sm hidden md:flex flex-col z-30 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
          <Link href="/dashboard" className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? "w-0 opacity-0" : "w-full opacity-100"}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex shrink-0 items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-brand-gradient font-bold text-lg whitespace-nowrap">Cognify</span>
          </Link>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors mx-auto shrink-0"
            title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <div className="flex flex-col gap-1 w-5 items-center justify-center">
              <span className="h-0.5 w-full bg-current rounded-full"></span>
              <span className={`h-0.5 bg-current rounded-full transition-all duration-300 ${isSidebarCollapsed ? 'w-full' : 'w-2/3 self-start'}`}></span>
              <span className="h-0.5 w-full bg-current rounded-full"></span>
            </div>
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {navigationOptions.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                } ${isSidebarCollapsed ? "justify-center" : "justify-start"}`}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${
                  isSidebarCollapsed ? "w-0 opacity-0" : "opacity-100"
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-border/50 shrink-0">
          <div className={`bg-muted/30 rounded-xl p-3 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${
            isSidebarCollapsed ? "items-center" : ""
          }`}>
            <div className={`flex flex-col truncate transition-all duration-300 ${isSidebarCollapsed ? "w-0 h-0 opacity-0 hidden" : "opacity-100"}`}>
              <span className="text-sm font-semibold text-foreground truncate">
                {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "Usuario"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              className={`flex items-center justify-center rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer ${
                isSidebarCollapsed ? "w-10 h-10 p-0 rounded-full" : "w-full gap-2 px-3 py-2"
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${
                isSidebarCollapsed ? "w-0 opacity-0 hidden" : "opacity-100"
              }`}>
                Cerrar sesión
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Header móvil (solo visible en pantallas pequeñas) */}
      <header className="fixed top-0 left-0 w-full h-20 bg-card/90 backdrop-blur-md border-b border-border/50 z-30 md:hidden flex justify-between items-center px-4 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-brand-gradient font-bold text-lg">Cognify</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="p-2 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Area: se ajusta dependiendo si el sidebar está colapsado o no (`md:pl-20` vs `md:pl-64`) */}
      <main className={`pt-20 pb-24 md:pt-0 md:pb-0 min-h-screen transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
      }`}>
        <div className="h-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Dynamic Mobile Nav (solo visible en pantallas pequeñas) */}
      <div className="fixed bottom-0 left-0 w-full bg-card border-t border-border/50 z-30 md:hidden flex justify-around p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        {navigationOptions.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
        })}
      </div>
    </div>
  );
}

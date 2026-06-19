"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import NavHeader from "@/Components/molecules/NavHeader";
import { Brain, Menu, X } from "lucide-react";

/**
 * Componente de navegación principal (Header).
 * 
 * Este encabezado se muestra en todas las páginas públicas del sitio (landing).
 * 
 * Se encarga de:
 * 1. Comprobar dinámicamente el estado de autenticación del usuario (Supabase).
 * 2. Mostrar opciones de inicio de sesión/registro si el usuario no está autenticado.
 * 3. Mostrar accesos al Dashboard (o Admin, según rol/correo) si ya inició sesión.
 * 4. Ocultarse automáticamente en rutas de Auth, Dashboard o Administración.
 * 5. Proveer un menú tipo "hamburguesa" responsivo para pantallas móviles.
 * 
 * @returns {JSX.Element | null} La interfaz del encabezado, o null si la ruta está excluida.
 */
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const authRoutes = ["/login", "/register", "/forgot-password"];
  
  // Ocultar el Header solo si estamos en las rutas de Auth, DENTRO del Dashboard o en Admin
  if (authRoutes.includes(pathname) || pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return null;

  return (
    <header className="fixed top-0 w-full z-50 flex flex-col bg-background/80 backdrop-blur-lg shadow-sm">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 h-20">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Brain className="w-5 h-5" color="white" />
          </div>
          <p className="text-brand-gradient font-bold text-lg cursor-pointer">
            Cognify
          </p>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center">
          <NavHeader className="text-muted-foreground hover:text-primary duration-300 transition-colors" />
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {loading ? null : user ? (
            <>
              <Link
                href={user?.email?.toLowerCase() === 'mauriciocotufa@gmail.com' ? "/dashboard/admin" : "/dashboard"}
                className="cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300"
              >
                Ir al Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-xl text-muted-foreground font-medium bg-muted shadow-sm hover:bg-muted/80 transition-all duration-300"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300"
              >
                Comenzar gratis
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle button */}
        <button
          type="button"
          className="md:hidden p-2 text-muted-foreground hover:text-primary focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border/50 flex flex-col px-6 py-4 shadow-lg absolute top-20 left-0 w-full pb-6">
          <nav className="flex flex-col mb-6">
            <NavHeader
              wrapperClassName="flex-col gap-4 text-lg"
              className="block w-full py-2 text-muted-foreground font-medium hover:text-primary transition-colors"
              onLinkClick={() => setIsMobileMenuOpen(false)}
            />
          </nav>
          <div className="flex flex-col gap-3">
             {loading ? null : user ? (
                <>
                  <Link
                    href={user?.email?.toLowerCase() === 'mauriciocotufa@gmail.com' ? "/dashboard/admin" : "/dashboard"}
                    className="w-full text-center whitespace-nowrap px-6 py-3 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300 text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Ir al Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-center whitespace-nowrap px-6 py-3 rounded-xl text-muted-foreground font-medium bg-muted shadow-sm hover:bg-muted/80 transition-all duration-300 text-lg"
                  >
                    Cerrar Sesión
                  </button>
                </>
             ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full text-center whitespace-nowrap px-6 py-3 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300 text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="w-full text-center whitespace-nowrap px-6 py-3 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300 text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Comenzar gratis
                  </Link>
                </>
             )}
          </div>
        </div>
      )}
    </header>
  );
}

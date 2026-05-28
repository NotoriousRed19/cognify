"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

/**
 * SessionGuard — invalida sesiones huérfanas de pestañas anteriores (Supabase version).
 * Si la URL tiene ?session_init=true (puesto por el callback de auth tras confirmación
 * de email), se activa la sesión en sessionStorage en vez de cerrarla.
 */
export default function SessionGuard() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const sessionInit = searchParams.get("session_init");

        if (sessionInit === "true") {
          // Viene de confirmación de email o callback de auth — activar sesión
          sessionStorage.setItem("cognify-active-session", "true");

          // Limpiar el parámetro de la URL sin recargar la página
          const params = new URLSearchParams(searchParams.toString());
          params.delete("session_init");
          const cleanUrl = params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname;
          router.replace(cleanUrl);
          return;
        }

        const isActive = sessionStorage.getItem("cognify-active-session");
        if (!isActive) {
          await supabase.auth.signOut();
        }
      }
    };

    checkSession();
  }, [supabase.auth, searchParams, router, pathname]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

/**
 * Componente proveedor de seguridad de sesión (SessionGuard).
 * 
 * Se encarga de invalidar "sesiones huérfanas" provenientes de otras pestañas o 
 * navegadores cerrados incorrectamente. Esto asegura que cada nueva pestaña requiera
 * reautenticación a menos que provenga directamente de un flujo de inicio de sesión.
 * 
 * Lógica principal:
 * 1. Verifica si existe una sesión activa en Supabase.
 * 2. Si la URL contiene el parámetro `?session_init=true` (ej. callback tras login), 
 *    establece una marca en el `sessionStorage` para mantener la sesión activa en esa pestaña.
 * 3. Si existe sesión en Supabase pero NO está la marca en `sessionStorage`, 
 *    fuerza un cierre de sesión (`signOut()`).
 * 
 * @returns {null} Este componente no renderiza ninguna interfaz visible.
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

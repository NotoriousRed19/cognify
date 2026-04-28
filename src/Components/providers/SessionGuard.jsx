"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * SessionGuard — invalida sesiones huérfanas de pestañas anteriores (Supabase version).
 */
export default function SessionGuard() {
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // En Supabase, a menos que el usuario marque "Recordarme",
        // podemos cerrar sesión si no hay flag de sesión activa.
        // Como este era el comportamiento deseado con NextAuth, lo replicamos.
        // NOTA: Supabase por defecto guarda la sesión en localStorage.
        const isActive = sessionStorage.getItem("cognify-active-session");
        if (!isActive) {
          await supabase.auth.signOut();
        }
      }
    };

    checkSession();
  }, [supabase.auth]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * SessionGuard — invalida sesiones huérfanas de pestañas anteriores.
 *
 * Estrategia: sessionStorage es específico por pestaña. Cuando el usuario
 * hace login explícito, guardamos un flag "cognify-active-session".
 * Si no existe ese flag pero hay una cookie de sesión activa (estado
 * "authenticated"), significa que la sesión viene de otra pestaña/run
 * anterior → hacemos signOut automático.
 */
export default function SessionGuard() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      const isActive = sessionStorage.getItem("cognify-active-session");
      if (!isActive) {
        // Sesión huérfana: cierre automático sin redirigir
        signOut({ redirect: false });
      }
    }
  }, [status]);

  return null;
}

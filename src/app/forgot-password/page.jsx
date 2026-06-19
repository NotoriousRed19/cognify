"use client";

import { useState } from "react";
import { Brain, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

/**
 * Página de Recuperación de Contraseña (ForgotPasswordPage).
 * 
 * Propósito:
 * Proveer a los usuarios (profesionales) una interfaz para solicitar 
 * un enlace seguro de restablecimiento de contraseña vía correo electrónico.
 * 
 * Flujo de ejecución y lógica:
 * 1. Inicialización (`supabase`): Instancia el cliente de Supabase (lado cliente).
 * 2. Gestión de Estado: Maneja el input del correo electrónico (`email`), estado 
 *    de carga (`loading`), y mensajes de retroalimentación (`message`, `error`).
 * 3. Envío del Formulario (`handleSubmit`):
 *    - Previene recargas de página y limpia errores previos.
 *    - Valida que el campo de correo no esté vacío.
 *    - Llama a `supabase.auth.resetPasswordForEmail()`:
 *      - `redirectTo`: Define la URL de callback que procesará el token seguro generado 
 *        por Supabase Auth (`/api/auth/callback?next=/update-password`).
 *    - Captura errores específicos o devuelve un mensaje genérico de éxito (ofuscando 
 *      intencionalmente si el correo existe o no por razones de seguridad/privacidad).
 * 
 * @returns {JSX.Element} El formulario interactivo de recuperación de contraseña.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
        }
      );

      if (error) {
        setError(`Error: ${error.message}`);
      } else {
        setMessage(
          "Si el correo está registrado, te enviaremos un enlace para restablecer tu contraseña."
        );
      }
    } catch {
      setError("Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="min-h-screen bg-gradient-soft-pattern flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <p className="text-brand-gradient font-bold text-lg cursor-pointer">
              Cognify
            </p>
          </Link>
          <div className="bg-card rounded-2xl border border-border/50 shadow-elevated p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Recuperar contraseña
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Ingresa tu correo y te enviaremos instrucciones para crear una nueva contraseña.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                {error}
              </p>
            )}

            {message && (
              <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4">
                {message}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className="flex h-11 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors pl-10"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

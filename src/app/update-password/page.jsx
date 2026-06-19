"use client";

import { useState, useEffect } from "react";
import { Brain, Lock, EyeOff, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

/**
 * Página de Actualización de Contraseña (UpdatePasswordPage).
 * 
 * Propósito:
 * Proveer la interfaz para que los usuarios cambien su contraseña de acceso.
 * Esta página suele ser accedida a través de un enlace mágico (magic link) 
 * enviado por correo tras solicitar la recuperación desde `/forgot-password`.
 * 
 * Flujo de ejecución y lógica:
 * 1. Validación de Sesión (`checkSession` en `useEffect`):
 *    - Se ejecuta al montar el componente.
 *    - Verifica de forma asíncrona si existe una sesión activa (`supabase.auth.getSession`).
 *    - El flujo estándar de Supabase establece la sesión automáticamente a partir 
 *      del token en el enlace mágico antes de redirigir a esta página.
 *    - Si no hay sesión (enlace expirado o acceso manual incorrecto), bloquea el 
 *      envío de formulario y muestra un mensaje de error.
 * 2. Validación de Formulario (`handleSubmit`):
 *    - Verifica que ambos campos (contraseña y confirmación) estén llenos, coincidan 
 *      y tengan una longitud mínima de 6 caracteres.
 * 3. Actualización Segura (`supabase.auth.updateUser`):
 *    - Solicita a Supabase el cambio de contraseña vinculado a la sesión actual activa.
 *    - Si es exitoso, informa al usuario y lo redirige automáticamente a `/dashboard` 
 *      después de 2 segundos.
 * 4. UX/UI: Alternancia de visibilidad de contraseña y manejo de estados (cargando/error).
 * 
 * @returns {JSX.Element} El formulario de actualización de contraseña segura.
 */
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Verifica si hay una sesión activa, si no la hay, este enlace puede que no sea válido
  // (aunque Supabase auth callback establece la sesión antes de redirigir aquí)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("No tienes una sesión activa. Si el enlace expiró, solicita uno nuevo.");
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(`Error: ${error.message}`);
      } else {
        setMessage("¡Tu contraseña ha sido actualizada exitosamente!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
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
                Actualizar contraseña
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Ingresa tu nueva contraseña a continuación.
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
                  htmlFor="password"
                  className="text-sm font-medium leading-none"
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    className="flex h-11 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors pl-10 pr-10"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium leading-none"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    className="flex h-11 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors pl-10 pr-10"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !!error.includes("No tienes una sesión activa")}
                className="w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? "Actualizando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

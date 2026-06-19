"use client";

import { useState, useEffect } from "react";
import { Brain, Mail, Lock, EyeOff, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import GoogleIcon from "@/Components/atoms/GoogleIcon";

const supabase = createClient();

/**
 * Página de Inicio de Sesión (LoginPage).
 * 
 * Propósito:
 * Proveer la interfaz principal para que los profesionales médicos autentiquen 
 * su acceso a la plataforma Cognify. Soporta inicio de sesión con email/contraseña
 * y OAuth (Google).
 * 
 * Flujo de ejecución y lógica:
 * 1. Inicialización: Instancia `supabase` cliente y recupera parámetros de URL (`error`) 
 *    por si hay fallos provenientes de redirecciones (ej. validación de email).
 * 2. OAuth (Google - `handleGoogleLogin`):
 *    - Deja una marca (`cognify-active-session`) en `sessionStorage` para sincronizar estados.
 *    - Inicia el flujo OAuth redirigiendo a `/api/auth/callback?action=login`.
 * 3. Email/Password (`handleSubmit`):
 *    - Valida campos locales y envía solicitud a Supabase Auth.
 *    - Intercepta errores comunes (credenciales inválidas, email no confirmado) traduciéndolos al español.
 *    - Al ser exitoso, marca la sesión y redirige a `/dashboard`.
 * 4. UX/UI: Incluye validación de estado de carga, toggle para ver contraseña (`showPassword`) 
 *    y enlaces a recuperación/registro.
 * 
 * @returns {JSX.Element} El formulario interactivo de inicio de sesión.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    sessionStorage.setItem("cognify-active-session", "true");
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?action=login`
      }
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(err);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError("Debes confirmar tu correo electrónico antes de iniciar sesión.");
        } else if (error.message.includes("Invalid login credentials")) {
          setError("Correo o contraseña incorrectos.");
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        sessionStorage.setItem("cognify-active-session", "true");
        router.push("/dashboard");
      }
    } catch {
      setError("Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section id="login">
        <div className="min-h-screen bg-gradient-soft-pattern flex items-center justify-center px-4">
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
                  Iniciar sesión
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Bienvenido de nuevo a Cognify
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group"
              >
                <GoogleIcon />
                <span className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                  Iniciar sesión con Google
                </span>
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border/50"></div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  o
                </span>
                <div className="flex-1 h-px bg-border/50"></div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">
                  {error}
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium leading-none"
                    >
                      Contraseña
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                ¿No tienes cuenta?{" "}
                <Link
                  href="/register"
                  className="text-primary font-semibold hover:underline"
                >
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

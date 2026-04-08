"use client";

import { useState } from "react";
import { Brain, User, Mail, Lock, EyeOff, Eye, AlertCircle, X } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import GoogleIcon from "@/Components/atoms/GoogleIcon";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // TODO: Reemplaza con tu endpoint real de registro
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        
        if (res.status === 409 || data.message?.includes("Ya existe")) {
          setModalMessage(data.message || "El correo ya está en uso.");
          setErrorModalVisible(true);
        } else {
          setError(data.message || "Error al crear la cuenta.");
        }
        return;
      }

      // Inicio de sesión automático después del registro
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
      });
    } catch {
      setError("Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section id="register">
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
                  Crear una cuenta
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Comienza tu prueba gratuita de 14 días
                </p>
              </div>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group"
              >
                <GoogleIcon />
                <span className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                  Registrarse con Google
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
                    htmlFor="name"
                    className="text-sm font-medium leading-none"
                  >
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Dr. Juan Pérez"
                      className="flex h-11 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors pl-10"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

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
                  <label
                    htmlFor="password"
                    className="text-sm font-medium leading-none"
                  >
                    Contraseña
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="text-primary font-semibold hover:underline"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pop-up / Modal de Error */}
      {errorModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-elevated border border-border/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Correo en uso
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Este correo electrónico ya está registrado en Cognify.
              </p>
              <div className="flex gap-3 w-full">
                <Link
                  href="/login"
                  className="flex-1 py-2.5 flex items-center justify-center rounded-xl border border-border/50 bg-background text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <button
                  onClick={() => setErrorModalVisible(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-white font-medium text-sm hover:opacity-90 shadow-md transition-opacity cursor-pointer"
                >
                  Intentar otro
                </button>
              </div>
            </div>
            <button 
              onClick={() => setErrorModalVisible(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

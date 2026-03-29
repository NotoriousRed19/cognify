"use client";

import { useState } from "react";
import { Brain, User, Mail, Lock, EyeOff, Eye } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import GoogleIcon from "@/Components/atoms/GoogleIcon";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main>
      <section id="register">
          <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
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
                  onClick={() => signIn("google", { callbackUrl: "/" })}
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

                <form className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium leading-none">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Dr. Juan Pérez"
                        className="flex h-11 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors pl-10"
                        id="name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        className="flex h-11 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors pl-10"
                        id="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        className="flex h-11 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors pl-10 pr-10"
                        id="password"
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
                    className="w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    Crear cuenta gratis
                  </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </div>
          </div>
      </section>
    </main>
  );
}

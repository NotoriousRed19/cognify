import { Shield, ArrowRight, Brain } from "lucide-react";
import {
  CalendarCheckIcon,
  ShieldCheckIcon,
  CalendarDays,
  FileText,
  Users,
  Bell,
  BarChart3,
  Lock,
  Check,
} from "lucide-react";
import Button from "@/Components/atoms/Button";
import TestimonialCarousel from "@/Components/organism/TestimonialCarousel";
import NavFooter from "@/Components/molecules/NavFooter";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <main>
        <section
          id="Hero"
          className="relative overflow-hidden bg-gradient-soft items-center flex w-full h-screen pt-20"
        >
          <div className="container lg:mx-60 sm:mx-auto px-6 py-20 ">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full w-fit h-9 ">
                  <svg width="0" height="0" className="absolute">
                    <linearGradient
                      id="brandGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop stopColor="#7b61ae" offset="0%" />
                      <stop stopColor="#5f74c7" offset="100%" />
                    </linearGradient>
                  </svg>
                  <Shield className="text-brand-gradient w-4 h-4" />
                  <span className="text-brand-gradient font-medium text-md">
                    Plataforma segura y certificada
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight text-foreground">
                  Gestiona tus consultas <br />
                  con{" "}
                  <span className="text-brand-gradient">claridad y calma</span>
                </h1>
                <p className="text-lg font-mono text-muted-foreground font-semibold max-w-lg leading-relaxed ">
                  Cognify simplifica la gestión de citas, expedientes y
                  seguimiento de pacientes para profesionales de la salud
                  mental. Todo en un solo lugar.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-fit">
                  <Button className="bg-gradient-primary w-full sm:w-fit h-12 flex items-center justify-center text-primary-foreground text-base px-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300">
                    <span className="flex-1 text-center whitespace-nowrap">
                      Prueba gratis 14 días
                    </span>
                    <ArrowRight className="ml-2 w-4 h-4 shrink-0" />
                  </Button>

                  <a
                    href="/login"
                    className="bg-gradient-primary w-full sm:w-fit h-12 flex items-center justify-center text-primary-foreground text-base px-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300"
                  >
                    <span className="flex-1 text-center whitespace-nowrap">
                      Iniciar sesión
                    </span>
                    <Brain className="ml-2 w-5 h-5 text-white shrink-0" />
                  </a>
                </div>
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarCheckIcon className="w-4 h-4 text-accent" />
                    <p>+2,500 citas gestionadas</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheckIcon className="w-4 h-4 text-accent" />
                    <p>Datos encriptados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="Funciones" className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-lg font-mono text-accent uppercase tracking-wider">
                Funcionalidades
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4">
                Todo lo que{" "}
                <span className="text-brand-gradient">necesitas</span> para tu{" "}
                <span className="text-brand-gradient">práctica</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Herramientas diseñadas específicamente para profesionales de la
                salud mental.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group hover-card">
                <div className=" bg-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  Agenda inteligente
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Gestiona citas con vista diaria, semanal y mensual.
                  Recordatorios automáticos para ti y tus <br />
                  pacientes.
                </p>
              </div>
              <div className="group hover-card">
                <div className=" bg-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  Expedientes clínicos
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Notas de sesión organizadas, historial completo y plantillas
                  personalizables para cada paciente.
                </p>
              </div>
              <div className="group hover-card">
                <div className=" bg-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  Gestión de pacientes
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Perfiles detallados, seguimiento de progreso y comunicación
                  segura con cada paciente.
                </p>
              </div>
              <div className="group hover-card">
                <div className=" bg-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  Recordatorios automáticos
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Notificaciones por email y SMS para reducir las ausencias y
                  mantener la agenda organizada.
                </p>
              </div>
              <div className="group hover-card">
                <div className="bg-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  Reportes y Analiticas
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Visualiza estadísticas de tu práctica: sesiones, ingresos,
                  asistencia y tendencias.
                </p>
              </div>
              <div className="group hover-card">
                <div className="bg-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  Seguridad y Privacidad
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cumplimiento con normativas de protección de datos. Toda la
                  información está encriptada.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="Testimonios" className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-lg font-mono text-accent uppercase tracking-wider">
                Testimonios
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4">
                Lo que dicen nuestros{" "}
                <span className="text-brand-gradient">usuarios</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Historias reales de profesionales que han transformado su
                práctica con Cognify.
              </p>
            </div>
            <TestimonialCarousel />
          </div>
        </section>
        <section id="Precios" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-lg font-mono text-accent uppercase tracking-wider">
                Precios
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4">
                Planes que se{" "}
                <span className="text-brand-gradient">adaptan</span> a ti
              </h2>
              <p className="text-muted-foreground text-lg">
                Comienza gratis durante 14 dias. Sin tarjeta de credito
                requerida
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 bg-card border-border/50 shadow-soft hover:shadow-card">
                <h3 className="text-xl font-heading font-bold text-foreground">
                  Esencial
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Ideal para terapeutas que inician su práctica.
                </p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-heading font-bold text-foreground">
                    $10
                  </span>
                  <span className="text-muted-foreground">/ mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Hasta 20 pacientes</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Agenda</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Recordatorios por Email</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Notas por sesion</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Soporte por Email</span>
                  </li>
                </ul>
                <Button className=" cursor-pointer border-2 border-accent text-accent inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full bg-secondary  hover:bg-secondary/80 transition-all ">
                  Comenzar Ahora
                </Button>
              </div>
              <div className="relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-primary/30 shadow-elevated scale-[1.02]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                  Más Popular
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground">
                  Profesional
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Para terapeutas establecidos con agenda completa.
                </p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-heading font-bold text-foreground">
                    $15
                  </span>
                  <span className="text-muted-foreground">/ mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Pacientes ilimitados</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Agenda inteligente</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Recordatorios por Email y SMS</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Notas por sesion</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Soporte prioritario</span>
                  </li>
                </ul>
                <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 px-4 py-2 w-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-all ">
                  Comenzar Ahora
                </Button>
              </div>
              <div className="relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 bg-card border-border/50 shadow-soft hover:shadow-card">
                <h3 className="text-xl font-heading font-bold text-foreground">
                  Enterprise
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Para clínicas con múltiples profesionales.
                </p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-heading font-bold text-foreground">
                    $30
                  </span>
                  <span className="text-muted-foreground">/ mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Todo del plan profesional</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Hasta 5 profesionales</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Panel administrativo</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Api personalizada</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Gerente de cuenta dedicado</span>
                  </li>
                </ul>
                <Button className="cursor-pointer border-2 border-accent text-accent inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full bg-secondary  hover:bg-secondary/80 transition-all">
                  Comenzar Ahora
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="justify-center items-center py-8 bg-muted/50 border-t border-border/50">
        <div className="container lg:mx-60 sm:mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center">
                <Brain className="w-5 h-5" color="white" />
              </div>
              <p className="text-brand-gradient font-bold text-lg cursor-pointer">
                Cognify
              </p>
            </div>
            <NavFooter className="text-gray-500 hover:text-[#886dbe] duration-300 transition-colors" />
            <p className="text-center text-sm text-muted-foreground">
              &copy; 2026 Cognify. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

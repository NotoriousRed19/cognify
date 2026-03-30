import {
  Shield,
  ArrowRight,
  Brain,
  CalendarCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="Hero"
      className="relative overflow-hidden bg-gradient-soft items-center flex w-full h-screen pt-20"
    >
      <div className="container lg:mx-60 sm:mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full w-fit h-9">
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
            <p className="text-lg text-muted-foreground font-semibold max-w-lg leading-relaxed">
              Cognify simplifica la gestión de citas, expedientes y seguimiento
              de pacientes para profesionales de la salud mental. Todo en un
              solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-fit">
              <Link
                href="/register"
                className="bg-gradient-primary w-full sm:w-fit h-12 flex items-center justify-center text-primary-foreground text-base px-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300"
              >
                <span className="flex-1 text-center whitespace-nowrap">
                  Prueba gratis 14 días
                </span>
                <ArrowRight className="ml-2 w-4 h-4 shrink-0" />
              </Link>

              <Link
                href="/login"
                className="bg-gradient-primary w-full sm:w-fit h-12 flex items-center justify-center text-primary-foreground text-base px-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300"
              >
                <span className="flex-1 text-center whitespace-nowrap">
                  Iniciar sesión
                </span>
                <Brain className="ml-2 w-5 h-5 text-white shrink-0" />
              </Link>
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
  );
}

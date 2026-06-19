import {
  Shield,
  ArrowRight,
  Brain,
  CalendarCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";

/**
 * HeroSection
 * 
 * @returns {JSX.Element} El componente renderizado.
 */
export default function HeroSection() {
  return (
    <section
      id="Hero"
      className="relative overflow-hidden bg-gradient-soft flex items-center w-full min-h-[100dvh] pt-28 pb-16 lg:pt-20 lg:pb-0"
    >
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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

          {/* Right Column: Patient CTA (v2 Styled) */}
          <div className="relative w-full max-w-md mx-auto lg:ml-auto group/card mt-10 lg:mt-0">
            {/* Animated Gradient Border effect using before/after */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-gradient to-transparent opacity-20 group-hover/card:opacity-40 transition-opacity duration-500 blur-sm pointer-events-none"></div>
            
            <div className="relative flex flex-col gap-6 p-8 rounded-[2rem] bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden transition-transform duration-500 hover:-translate-y-2">
              
              {/* Decorative inner background elements */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[50px] rounded-full pointer-events-none group-hover/card:bg-primary/30 transition-colors duration-500"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 blur-[50px] rounded-full pointer-events-none group-hover/card:bg-accent/30 transition-colors duration-500"></div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-primary/25">
                  <CalendarCheckIcon className="w-7 h-7 text-white" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl font-bold font-heading text-foreground mb-3">
                  Encuentra a tu <span className="text-brand-gradient">especialista</span>
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  Accede a nuestro directorio de profesionales certificados. Agenda tu próxima sesión en segundos con total confidencialidad.
                </p>
                
                <Link
                  href="/book"
                  className="bg-gradient-primary w-full h-12 flex items-center justify-center text-primary-foreground text-base px-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300 group"
                >
                  <span className="flex-1 text-center whitespace-nowrap font-medium">
                    Explorar directorio
                  </span>
                  <ArrowRight className="ml-2 w-5 h-5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import {
  CalendarDays,
  FileText,
  Users,
  Bell,
  BarChart3,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Agenda inteligente",
    description:
      "Gestiona citas con vista diaria, semanal y mensual. Recordatorios automáticos para ti y tus pacientes.",
  },
  {
    icon: FileText,
    title: "Expedientes clínicos",
    description:
      "Notas de sesión organizadas, historial completo y plantillas personalizables para cada paciente.",
  },
  {
    icon: Users,
    title: "Gestión de pacientes",
    description:
      "Perfiles detallados, seguimiento de progreso y comunicación segura con cada paciente.",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description:
      "Notificaciones por email y SMS para reducir las ausencias y mantener la agenda organizada.",
  },
  {
    icon: BarChart3,
    title: "Reportes y analíticas",
    description:
      "Visualiza estadísticas de tu práctica: sesiones, ingresos, asistencia y tendencias.",
  },
  {
    icon: Lock,
    title: "Seguridad y privacidad",
    description:
      "Cumplimiento con normativas de protección de datos. Toda la información está encriptada.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="Funciones" className="relative py-24 bg-background overflow-hidden">
      {/* Background ambient blobs to make glassmorphism visible */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lg text-accent uppercase tracking-wider">
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
          {features.map((feature) => (
            <div key={feature.title} className="relative group/card">
              {/* Animated Gradient Border effect */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-gradient to-transparent opacity-20 group-hover/card:opacity-40 transition-opacity duration-500 blur-sm pointer-events-none"></div>

              <div className="group hover-card relative overflow-hidden bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 shadow-xl transition-transform duration-500 hover:-translate-y-2">
                {/* Decorative inner background elements */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-[40px] rounded-full pointer-events-none group-hover/card:bg-primary/30 transition-colors duration-500"></div>
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/20 blur-[40px] rounded-full pointer-events-none group-hover/card:bg-accent/30 transition-colors duration-500"></div>
                
                <div className="relative z-10">
                  <div className="bg-gradient-primary w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

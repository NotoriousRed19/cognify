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
    <section id="Funciones" className="py-24 bg-background">
      <div className="container mx-auto px-6">
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
            <div key={feature.title} className="group hover-card">
              <div className="bg-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

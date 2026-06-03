import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  const plan = {
    name: "Profesional",
    description: "Para terapeutas establecidos con agenda completa.",
    priceMonthly: "$15",
    priceYearly: "$150",
    features: [
      "Sistema de reservas",
      "Pacientes ilimitados",
      "Agenda inteligente",
      "Recordatorios por email y SMS",
      "Notas por sesión",
      "Soporte prioritario",
    ],
  };

  return (
    <section id="Precios" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lg text-accent uppercase tracking-wider">
            Precios
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4">
            Un plan que se{" "}
            <span className="text-brand-gradient">adapta</span> a ti
          </h2>
          <p className="text-muted-foreground text-lg">
            Comienza gratis durante 14 días. Sin tarjeta de crédito requerida.
          </p>
        </div>
        <div className="flex justify-center max-w-5xl mx-auto pt-4">
          <div className="relative p-10 rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/30 shadow-2xl group">
            
            {/* Inner wrapper for glowing aura to prevent clipping the badge */}
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
              <div className="absolute -top-24 -right-24 w-56 h-56 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-colors duration-500"></div>
              <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-accent/10 blur-[60px] rounded-full group-hover:bg-accent/20 transition-colors duration-500"></div>
            </div>
            
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 px-5 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold tracking-wide uppercase shadow-md">
              Más Popular
            </div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-heading font-bold text-foreground text-center">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-3 mb-8 text-center px-4 leading-relaxed">
                {plan.description}
              </p>
              <div className="flex flex-col gap-2 mb-10 text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl font-heading font-bold text-foreground">
                    {plan.priceMonthly}
                  </span>
                  <span className="text-muted-foreground font-medium">/ mes</span>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-heading font-bold text-foreground/80">
                    {plan.priceYearly}
                  </span>
                  <span className="text-muted-foreground text-sm">/ año (Ahorras 20%)</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-4 text-sm text-foreground font-medium"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="bg-gradient-primary w-full h-12 flex items-center justify-center text-primary-foreground text-base px-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300 group"
              >
                <span className="flex-1 text-center whitespace-nowrap font-medium">
                  Comenzar ahora
                </span>
                <ArrowRight className="ml-2 w-5 h-5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

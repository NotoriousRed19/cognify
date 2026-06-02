import { Check } from "lucide-react";
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
        <div className="flex justify-center max-w-5xl mx-auto">
          <div className="relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 w-full max-w-sm bg-gradient-card border-primary/30 shadow-elevated">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold whitespace-nowrap">
              Más Popular
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground text-left">
              {plan.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6 text-left">
              {plan.description}
            </p>
            <div className="flex flex-col gap-2 mb-8 text-left">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-heading font-bold text-foreground">
                  {plan.priceMonthly}
                </span>
                <span className="text-muted-foreground">/ mes</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-heading font-bold text-foreground/80">
                  {plan.priceYearly}
                </span>
                <span className="text-muted-foreground text-sm">/ año</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="inline-flex items-center justify-center w-full h-10 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              Comenzar ahora
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

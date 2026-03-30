import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Esencial",
    description: "Ideal para terapeutas que inician su práctica.",
    price: "$10",
    popular: false,
    features: [
      "Hasta 20 pacientes",
      "Agenda",
      "Recordatorios por email",
      "Notas por sesión",
      "Soporte por email",
    ],
  },
  {
    name: "Profesional",
    description: "Para terapeutas establecidos con agenda completa.",
    price: "$15",
    popular: true,
    features: [
      "Pacientes ilimitados",
      "Agenda inteligente",
      "Recordatorios por email y SMS",
      "Notas por sesión",
      "Soporte prioritario",
    ],
  },
  {
    name: "Enterprise",
    description: "Para clínicas con múltiples profesionales.",
    price: "$30",
    popular: false,
    features: [
      "Todo del plan profesional",
      "Hasta 5 profesionales",
      "Panel administrativo",
      "API personalizada",
      "Gerente de cuenta dedicado",
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="Precios" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lg text-accent uppercase tracking-wider">
            Precios
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4">
            Planes que se{" "}
            <span className="text-brand-gradient">adaptan</span> a ti
          </h2>
          <p className="text-muted-foreground text-lg">
            Comienza gratis durante 14 días. Sin tarjeta de crédito requerida.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "bg-gradient-card border-primary/30 shadow-elevated scale-[1.02]"
                  : "bg-card border-border/50 shadow-soft hover:shadow-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                  Más Popular
                </div>
              )}
              <h3 className="text-xl font-heading font-bold text-foreground">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                {plan.description}
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-heading font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-muted-foreground">/ mes</span>
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
                className={`inline-flex items-center justify-center w-full h-10 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  plan.popular
                    ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                    : "border-2 border-accent text-accent hover:bg-accent/10"
                }`}
              >
                Comenzar ahora
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

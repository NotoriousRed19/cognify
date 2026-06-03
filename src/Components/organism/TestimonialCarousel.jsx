"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "Cognify transformó la manera en que gestiono mis consultas. Ahora dedico más tiempo a mis pacientes y menos a la administración.",
    name: "Elibeth Castellanos",
    role: "Psicóloga Clínica",
    initials: "EC",
    stars: 5,
  },
  {
    quote:
      "La función de expedientes clínicos es excepcional. Puedo acceder al historial de cada paciente en segundos y las notas están siempre organizadas.",
    name: "María López",
    role: "Psicóloga Clínica",
    initials: "ML",
    stars: 5,
  },
  {
    quote:
      "Los recordatorios automáticos redujeron mis cancelaciones en un 60%. La inversión se paga sola con la primera semana de uso.",
    name: "Lic. Ana García",
    role: "Psicoterapeuta",
    initials: "AG",
    stars: 5,
  },
  {
    quote:
      "La seguridad de los datos me da tranquilidad. Sé que la información de mis pacientes está protegida y cumple con todas las normativas.",
    name: "Dr. Carlos Méndez",
    role: "Psiquiatra",
    initials: "CM",
    stars: 5,
  },
  {
    quote:
      "Antes usaba hojas de cálculo para todo. Cognify me ahorró horas de trabajo administrativo cada semana. No volvería atrás.",
    name: "Lic. Sofía Ramírez",
    role: "Terapeuta Familiar",
    initials: "SR",
    stars: 5,
  },
  {
    quote:
      "El panel de analíticas me permite ver tendencias en mi práctica que antes no notaba. Una herramienta imprescindible para crecer profesionalmente.",
    name: "Dr. Alejandro Torres",
    role: "Psicólogo Organizacional",
    initials: "AT",
    stars: 5,
  },
];

const ITEMS_PER_SLIDE = 3;
const AUTO_SCROLL_INTERVAL = 4000;

function TestimonialCard({ testimonial }) {
  return (
    <div className="relative group/card h-full">
      {/* Animated Gradient Border effect */}
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-gradient to-transparent opacity-20 group-hover/card:opacity-40 transition-opacity duration-500 blur-sm pointer-events-none"></div>

      <div className="relative h-full overflow-hidden p-8 rounded-[2rem] bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl transition-transform duration-500 group-hover/card:-translate-y-2">
        {/* Decorative inner background elements */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/20 blur-[50px] rounded-full pointer-events-none group-hover/card:bg-primary/30 transition-colors duration-500"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-accent/20 blur-[50px] rounded-full pointer-events-none group-hover/card:bg-accent/30 transition-colors duration-500"></div>
        
        <div className="relative z-10 flex flex-col h-full">
        <div className="flex gap-1 mb-6">
          {Array.from({ length: testimonial.stars }).map((_, i) => (
            <Star key={i} className="w-5 h-5 text-accent fill-accent" />
          ))}
        </div>
        <p className="text-foreground leading-relaxed mb-8 italic">
          &quot;{testimonial.quote}&quot;
        </p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
            {testimonial.initials}
          </div>
          <div>
            <p className="font-heading font-bold text-foreground">
              {testimonial.name}
            </p>
            <p className="text-muted-foreground text-sm">{testimonial.role}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function TestimonialCarousel() {
  const slides = [];
  for (let i = 0; i < testimonials.length; i += ITEMS_PER_SLIDE) {
    slides.push(testimonials.slice(i, i + ITEMS_PER_SLIDE));
  }

  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const total = slides.length;

  const goTo = useCallback(
    (index) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % total);
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total);
  }, [current, total, goTo]);

  useEffect(() => {
    const timer = setInterval(next, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((group, gi) => (
            <div key={gi} className="w-full shrink-0">
              <div className="grid md:grid-cols-3 gap-8 py-8 px-4">
                {group.map((t, ti) => (
                  <TestimonialCard key={ti} testimonial={t} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-card border border-border/50 shadow-soft flex items-center justify-center hover:shadow-card transition-all duration-300 hover:-translate-x-5 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-card border border-border/50 shadow-soft flex items-center justify-center hover:shadow-card transition-all duration-300 hover:translate-x-5 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </>
      )}

      {total > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir al grupo ${i + 1}`}
              className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                i === current
                  ? "bg-accent w-8"
                  : "bg-border hover:bg-muted-foreground w-3"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

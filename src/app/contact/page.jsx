import { Mail, Brain, MessageSquareHeart } from "lucide-react";

export const metadata = {
  title: "Contacto | Cognify",
  description: "Ponte en contacto con el equipo de Cognify.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-soft pt-32 pb-20 flex items-center justify-center">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-brand-gradient/5 text-center relative overflow-hidden group">
          
          {/* Decorative background glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors duration-500"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-accent/30 transition-colors duration-500"></div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
              <MessageSquareHeart className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
              Estamos aquí para <span className="text-brand-gradient">ayudarte</span>
            </h1>
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed max-w-md mx-auto">
              ¿Tienes alguna duda, necesitas soporte técnico o quieres darnos feedback? Escríbenos y te responderemos lo más pronto posible.
            </p>

            <div className="flex flex-col gap-8 items-center mt-4">
              <a 
                href="mailto:LopezmauricioDev@gmail.com" 
                className="bg-gradient-primary h-12 flex items-center justify-center text-primary-foreground text-base px-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300 gap-3"
              >
                <Mail className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">
                  LopezmauricioDev@gmail.com
                </span>
              </a>
              
              <div className="mt-10 pt-10 border-t border-border/50 w-full flex flex-col items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <p className="text-base font-medium text-muted-foreground text-center">
                  Plataforma diseñada y desarrollada con pasión y dedicación en Venezuela.
                </p>
                
                <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent/10 border border-accent/20 rounded-full mt-1 shadow-sm hover:shadow-md hover:bg-accent/20 transition-all duration-300 cursor-default">
                  <span className="text-accent text-sm font-bold tracking-widest uppercase">
                    Created By SantanaDev
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

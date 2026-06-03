import HeroSection from "@/Components/organism/HeroSection";
import FeaturesSection from "@/Components/organism/FeaturesSection";
import TestimonialCarousel from "@/Components/organism/TestimonialCarousel";
import PricingSection from "@/Components/organism/PricingSection";
import Footer from "@/Components/organism/Footer";

export default function Home() {
  return (
    <>
      <main>
        <HeroSection />
        <FeaturesSection />
        <section id="Testimonios" className="relative py-24 bg-background overflow-hidden">
          {/* Background ambient blobs to make glassmorphism visible */}
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2"></div>
          
          <div className="container relative z-10 mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-lg text-accent uppercase tracking-wider">
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
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}

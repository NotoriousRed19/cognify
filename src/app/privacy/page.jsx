/**
 * Metadatos para la ruta de Políticas de Privacidad.
 * Optimización SEO y configuración de título/descripción para la página `/privacy`.
 */
export const metadata = {
  title: "Política de Privacidad | Cognify",
  description: "Política de Privacidad de Cognify.",
};

/**
 * Página de Políticas de Privacidad (PrivacyPage).
 * 
 * Propósito:
 * Proveer a los usuarios y pacientes una vista pública, clara y estática sobre
 * cómo Cognify maneja la recopilación, protección y privacidad de sus datos de salud.
 * 
 * Elementos clave:
 * - Cumplimiento normativo básico de plataformas de salud mental.
 * - Estructura semántica simple basada en títulos (h2) y párrafos para fácil lectura.
 * - Diseño coherente (glassmorphism en `bg-card`) con el resto de la landing.
 * 
 * @returns {JSX.Element} La vista estática con el texto legal de privacidad.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-soft pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-brand-gradient/5">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-8">Política de <span className="text-brand-gradient">Privacidad</span></h1>
          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <p className="text-lg">
              En Cognify, la privacidad y seguridad de sus datos son nuestra máxima prioridad. Esta política explica de manera transparente cómo recopilamos, usamos y protegemos su información personal y de salud, en cumplimiento con las normativas de protección de datos vigentes.
            </p>
            
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Recopilación de Información</h2>
              <p>
                Recopilamos la información personal estrictamente necesaria para la gestión eficiente de citas y la creación de expedientes clínicos. Esto incluye datos de contacto básicos y la información de salud que comparta voluntariamente con su especialista.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Uso y Finalidad de los Datos</h2>
              <p>
                Los datos recopilados son utilizados exclusivamente para proveer y mejorar los servicios de la plataforma, facilitar la programación de reservas, y mantener el contacto directo entre profesionales de la salud mental y sus pacientes. No compartimos su información con terceros sin su consentimiento explícito.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. Seguridad de la Información</h2>
              <p>
                Implementamos robustas medidas de seguridad técnicas y organizativas de nivel empresarial, incluyendo encriptación de datos de extremo a extremo, para proteger su información contra el acceso no autorizado, alteración, divulgación o destrucción.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. Derechos del Usuario</h2>
              <p>
                Usted tiene pleno derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos personales. Si desea ejercer cualquiera de estos derechos, puede hacerlo a través de las configuraciones de su perfil o contactando a nuestro equipo de soporte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

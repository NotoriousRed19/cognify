/**
 * Metadatos para la ruta de Términos y Condiciones.
 * Optimización SEO y configuración de título/descripción para la página `/terms`.
 */
export const metadata = {
  title: "Términos y Condiciones | Cognify",
  description: "Términos y Condiciones de uso de Cognify.",
};

/**
 * Página de Términos y Condiciones (TermsPage).
 * 
 * Propósito:
 * Mostrar el acuerdo legal base bajo el cual los usuarios (pacientes y profesionales) 
 * pueden utilizar la plataforma Cognify. Aborda responsabilidades, uso del servicio, 
 * y los límites de la relación profesional-paciente.
 * 
 * Elementos clave:
 * - Estructura estática simple basada en títulos (h2) y párrafos.
 * - Diseño inmersivo coherente con el resto de la plataforma (backdrop-blur, bg-card).
 * 
 * @returns {JSX.Element} La vista estática con el texto de términos y condiciones.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-soft pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-brand-gradient/5">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-8">Términos y <span className="text-brand-gradient">Condiciones</span></h1>
          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <p className="text-lg">
              Al acceder y utilizar la plataforma Cognify, usted acepta estar sujeto a los siguientes términos y condiciones de uso. Le rogamos que los lea detenidamente antes de utilizar nuestros servicios.
            </p>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Uso del Servicio</h2>
              <p>
                Cognify es una plataforma diseñada para facilitar la gestión clínica a profesionales de la salud mental y optimizar el acceso a consultas para los pacientes. El usuario se compromete a hacer un uso adecuado y lícito de la plataforma, respetando todas las leyes aplicables.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Cuentas de Usuario y Seguridad</h2>
              <p>
                Para acceder a ciertas funciones, deberá registrarse y crear una cuenta. Es su responsabilidad exclusiva mantener la confidencialidad de sus credenciales de acceso. Cualquier actividad, reserva o pago realizado bajo su cuenta será considerado de su entera responsabilidad.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. Relación Profesional - Paciente</h2>
              <p>
                Cognify proporciona la infraestructura tecnológica para conectar a profesionales y pacientes, pero no interviene ni se responsabiliza de los tratamientos médicos, diagnósticos o consejos proporcionados durante las sesiones. La relación clínica es estrictamente entre el profesional y el paciente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. Modificaciones del Servicio</h2>
              <p>
                Nos reservamos el derecho de modificar, actualizar o discontinuar temporalmente características de la plataforma en cualquier momento. Se notificará a los usuarios sobre cambios significativos que puedan afectar su experiencia o la funcionalidad del servicio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

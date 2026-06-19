import { createClient } from "@/utils/supabase/server";
import BookingClient from "./BookingClient";
import { notFound } from "next/navigation";

/**
 * Página Pública de Reservas (BookDoctorPage).
 * 
 * Propósito:
 * Sirve como punto de entrada público para que los pacientes puedan agendar 
 * citas con un profesional específico, accediendo a través de su URL personalizada (slug).
 * 
 * Flujo de ejecución y lógica:
 * 1. Resolución de Slug (`params.slug`): Captura la ruta dinámica generada para el doctor.
 * 2. Validación de Perfil:
 *    - Inicializa `supabase` con permisos anónimos/públicos.
 *    - Consulta el modelo `User` filtrando por el slug y asegurando que `booking_enabled` sea true.
 *    - Si el perfil no existe o no se encuentra, invoca `notFound()` provocando un error 404.
 *    - Si el perfil existe pero tiene `booking_enabled` false, renderiza una pantalla de bloqueo 
 *      indicando que las reservas no están disponibles en este momento.
 * 3. Renderizado del Flujo de Reserva:
 *    - Si todas las validaciones pasan, inyecta los datos extraídos (id, nombre, instrucciones de pago)
 *      en el componente interactivo `BookingClient`, el cual maneja el proceso multipaso.
 * 
 * @param {Object} props - Propiedades de Next.js.
 * @param {Promise<{ slug: string }>} props.params - Parámetros de la URL dinámica.
 * @returns {Promise<JSX.Element>} La vista pública de reservas o la pantalla de bloqueo.
 */
export default async function BookDoctorPage({ params }) {
  const { slug } = await params;

  // Use the standard server client (anon key). 
  // RLS on User allows SELECT for authenticated, but we need public access here.
  // Since we only need public doctor profiles, we use an RPC or service-scoped query.
  // For now, use a server-side createClient and rely on RLS read policy.
  const supabase = await createClient();

  const { data: doctor, error } = await supabase
    .from("User")
    .select("id, name, slug, payment_instructions, booking_enabled")
    .eq("slug", slug)
    .eq("booking_enabled", true)
    .single();

  if (error || !doctor) {
    notFound();
  }

  if (!doctor.booking_enabled) {
    return (
      <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-card p-10 rounded-[2rem] shadow-card text-center border border-border/50">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl opacity-50">🔒</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-3">Reservas <span className="text-muted-foreground font-normal italic">no disponibles</span></h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            El Dr. {doctor.name} no tiene las reservas públicas habilitadas en este momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <BookingClient doctor={doctor} />
    </div>
  );
}

/**
 * Metadatos para la ruta de registro.
 * Optimización SEO y configuración de título/descripción para la página `/register`.
 */
export const metadata = {
  title: "Crear cuenta — Cognify",
  description:
    "Regístrate gratis en Cognify y comienza tu prueba de 14 días. Gestiona citas, expedientes y pacientes en un solo lugar.",
};

/**
 * Layout de Registro (RegisterLayout).
 * 
 * Propósito:
 * Envolver la página de registro (`/register/page.jsx`) para inyectar metadatos específicos.
 * Es un layout pasivo (solo renderiza `children`) diseñado para que la pantalla de registro
 * ocupe todo el viewport sin la navegación global de la aplicación.
 * 
 * @param {Object} props - Propiedades del layout.
 * @param {React.ReactNode} props.children - Los componentes hijos renderizados (page.jsx).
 * @returns {JSX.Element} El contenedor del layout.
 */
export default function RegisterLayout({ children }) {
  return children;
}

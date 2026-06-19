/**
 * Metadatos para la ruta de inicio de sesión.
 * Optimización SEO y configuración de título/descripción para la página `/login`.
 */
export const metadata = {
  title: "Iniciar sesión — Cognify",
  description:
    "Inicia sesión en tu cuenta de Cognify para gestionar tus consultas, pacientes y citas.",
};

/**
 * Layout de Inicio de Sesión (LoginLayout).
 * 
 * Propósito:
 * Envolver la página de inicio de sesión (`/login/page.jsx`) para aplicar metadatos específicos.
 * Es un layout pasivo (solo renderiza `children`) ya que la UI principal del login 
 * ocupa la pantalla completa por sí misma sin barras de navegación globales.
 * 
 * @param {Object} props - Propiedades del layout.
 * @param {React.ReactNode} props.children - Los componentes hijos renderizados (page.jsx).
 * @returns {JSX.Element} El contenedor del layout.
 */
export default function LoginLayout({ children }) {
  return children;
}

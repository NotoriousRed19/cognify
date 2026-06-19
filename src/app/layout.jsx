import { DM_Sans, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import Header from "@/Components/organism/Header";
import SessionGuard from "@/Components/providers/SessionGuard";

import "@/globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

/**
 * Metadatos globales de la aplicación Cognify.
 * Establece la configuración base SEO, etiquetas OpenGraph para redes sociales,
 * configuración de Twitter Cards y plantillas de título para subrutas.
 */
export const metadata = {
  metadataBase: new URL('https://cognify.app'), // TODO: Change to real production URL
  title: {
    default: "Cognify — Gestión para profesionales de salud mental",
    template: "%s | Cognify",
  },
  description:
    "Simplifica la gestión de citas, expedientes y seguimiento de pacientes para profesionales de la salud mental. Todo en un solo lugar.",
  keywords: ["psicología", "gestión de pacientes", "salud mental", "software médico", "expedientes clínicos", "citas", "terapia"],
  openGraph: {
    title: "Cognify — Gestión para profesionales de salud mental",
    description: "Simplifica la gestión de citas, expedientes y seguimiento de pacientes. Todo en un solo lugar.",
    url: "https://cognify.app",
    siteName: "Cognify",
    images: [
      {
        url: "/og-image.png", // TODO: Add an og-image.png to the public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognify — Gestión para profesionales de salud mental",
    description: "Software especializado en gestión de consultas de salud mental.",
  },
};

/**
 * Layout Principal de la Aplicación (RootLayout).
 * 
 * Propósito:
 * Punto de entrada principal en el App Router de Next.js. Este componente 
 * envuelve absolutamente todas las rutas de la plataforma Cognify.
 * 
 * Flujo de ejecución y lógica:
 * 1. Inicialización de Fuentes: 
 *    - Carga fuentes optimizadas de Google (`DM_Sans`, `Playfair_Display`) e inyecta
 *      sus variables CSS (`--font-dm-sans`, `--font-playfair`) al tag `<html>`.
 * 2. Inyección Global:
 *    - Importa y aplica la hoja de estilos global (`globals.css`).
 * 3. Elementos Fijos:
 *    - `SessionGuard`: Componente lógico sin UI visible (envuelto en `Suspense`)
 *      que monitoriza cambios asíncronos en la sesión a nivel global.
 *    - `Header`: Menú de navegación principal inyectado universalmente 
 *      (su propia lógica interna determina si se oculta en rutas específicas como `/dashboard`).
 * 4. Renderizado:
 *    - Provee la estructura base de `html` y `body`, delegando el resto del contenido
 *      a las páginas específicas que pasen por la propiedad `children`.
 * 
 * @param {Object} props - Propiedades inyectadas por Next.js.
 * @param {React.ReactNode} props.children - Las rutas anidadas que se renderizarán dentro del layout.
 * @returns {JSX.Element} La estructura envolvente base (DOM raíz) de la aplicación.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
      <body>
        <Suspense fallback={null}>
          <SessionGuard />
        </Suspense>
        <Header />
        {children}
      </body>
    </html>
  );
}

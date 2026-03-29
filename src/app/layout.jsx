import Header from "@/Components/organism/Header";
import SessionProvider from "@/Components/providers/SessionProvider";

import "@/globals.css";

export const metadata = {
  title: "Cognify — Gestión para profesionales de salud mental",
  description:
    "Simplifica la gestión de citas, expedientes y seguimiento de pacientes para profesionales de la salud mental. Todo en un solo lugar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="">
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

import { DM_Sans, Playfair_Display } from "next/font/google";
import Header from "@/Components/organism/Header";
import SessionProvider from "@/Components/providers/SessionProvider";

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

export const metadata = {
  title: "Cognify — Gestión para profesionales de salud mental",
  description:
    "Simplifica la gestión de citas, expedientes y seguimiento de pacientes para profesionales de la salud mental. Todo en un solo lugar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
      <body>
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

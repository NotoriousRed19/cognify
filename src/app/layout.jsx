import { DM_Sans, Playfair_Display } from "next/font/google";
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

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
      <body>
        <SessionGuard />
        <Header />
        {children}
      </body>
    </html>
  );
}

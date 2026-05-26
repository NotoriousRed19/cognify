"use client";

import { AlertOctagon } from "lucide-react";

export default function BillingLockScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] p-4 text-center">
      <div className="bg-red-50 p-8 rounded-2xl max-w-lg shadow-sm border border-red-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Suscripción Expirada
        </h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Por favor, comunícate con administración para renovar tu plan y recuperar el acceso a tus herramientas.
        </p>
        <a
          href="https://wa.me/584246270071?text=Hola,%20deseo%20renovar%20mi%20plan%20en%20Cognify"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm inline-block"
        >
          Contactar Administración
        </a>
      </div>
    </div>
  );
}

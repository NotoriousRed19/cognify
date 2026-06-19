'use client'
 
/**
 * Límite de Error Global (Global Error Boundary).
 * 
 * Propósito:
 * Actuar como el último mecanismo de captura de errores en la aplicación Next.js.
 * Si un error ocurre en el `layout.jsx` principal y no es atrapado por ningún
 * otro `error.jsx` anidado, este componente se montará, reemplazando toda la
 * estructura HTML.
 * 
 * Detalles técnicos:
 * - Debe ser "use client" ya que maneja interacciones y estados de error en el cliente.
 * - Debe devolver su propio tag `<html>` y `<body>` ya que reemplaza el layout raíz.
 * - Provee una función `reset` para intentar recuperar la aplicación forzando
 *   una recarga del segmento en error.
 * 
 * @param {Object} props - Propiedades inyectadas por Next.js.
 * @param {Error} props.error - El objeto de error capturado.
 * @param {Function} props.reset - Función para intentar recuperar la aplicación.
 * @returns {JSX.Element} La estructura HTML completa con el mensaje de error crítico.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="bg-card border border-border/50 shadow-md p-8 rounded-2xl max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">¡Oh no! Algo salió mal.</h2>
            <p className="text-muted-foreground mb-6">
              Ha ocurrido un error inesperado a nivel global en la aplicación.
            </p>
            <button 
              onClick={() => reset()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Intentar recargar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

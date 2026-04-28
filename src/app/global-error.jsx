'use client'
 
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

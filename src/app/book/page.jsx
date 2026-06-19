"use client";

import { useState, useEffect } from "react";
import { Search, ChevronRight, Stethoscope, ArrowRight, Loader2, Brain } from "lucide-react";
import Link from "next/link";
import { useDebounce } from "use-debounce";

/**
 * Página de Búsqueda de Profesionales (BookSearchPage).
 * 
 * Propósito:
 * Proveer un buscador público donde los pacientes pueden encontrar a su médico o
 * especialista por nombre, correo o slug, para posteriormente acceder a su perfil
 * y agendar una cita.
 * 
 * Flujo de ejecución y lógica:
 * 1. Gestión de Estado: Maneja el input de búsqueda (`query`), estado de carga (`loading`)
 *    y los resultados obtenidos (`results`).
 * 2. Optimización de Búsqueda: Utiliza `useDebounce` (500ms) sobre el `query` para evitar
 *    saturar la base de datos con peticiones por cada tecla pulsada.
 * 3. Fetch de Datos (`useEffect`): 
 *    - Se dispara automáticamente cuando el valor "debounced" cambia.
 *    - Consulta el endpoint interno `/api/doctors/search?q=...`.
 *    - Extrae el arreglo de médicos y actualiza el estado de la UI.
 * 4. Renderizado Condicional:
 *    - Muestra un spinner (`Loader2`) mientras la petición HTTP está en vuelo.
 *    - Renderiza una lista cliqueable (redirección a `/book/[slug]`) si hay resultados.
 *    - Muestra estados vacíos (empty states) si no hay resultados o si el input está vacío.
 * 
 * @returns {JSX.Element} El componente interactivo de búsqueda de doctores.
 */
export default function BookSearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function searchDoctors() {
      setLoading(true);
      try {
        const res = await fetch(`/api/doctors/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.doctors || []);
        }
      } catch (error) {
        console.error("Error buscando:", error);
      } finally {
        setLoading(false);
      }
    }

    searchDoctors();
  }, [debouncedQuery]);

  return (
    <div className="min-h-[100dvh] bg-gradient-soft flex flex-col font-sans">
      
      {/* Top Navbar Simple */}
      <header className="fixed top-0 w-full z-50 flex flex-col bg-background/80 backdrop-blur-lg shadow-sm border-b border-border/50">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 h-20">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center shadow-soft">
              <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-brand-gradient font-bold text-lg cursor-pointer">
              Cognify
            </p>
          </Link>
          <Link 
            href="/login" 
            className="cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-xl text-primary-foreground font-medium bg-gradient-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 transition-all duration-300"
          >
            Soy profesional
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-20 flex flex-col items-center">
        
        <div className="text-center mb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-foreground mb-4 leading-tight">
            Encuentra a tu <span className="text-brand-gradient">especialista.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-[50ch] mx-auto">
            Busca por nombre, correo o identificador para agendar tu próxima sesión.
          </p>
        </div>

        <div className="w-full max-w-xl relative animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-13 pr-12 py-4 bg-card border border-border/60 rounded-[1.5rem] shadow-soft focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-lg transition-all placeholder:text-muted-foreground/50 text-foreground"
              placeholder="Ej. Dr. Mauricio, pedro@correo.com..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
            )}
          </div>

          {/* Results Box */}
          {(debouncedQuery || results.length > 0) && (
            <div className="mt-4 bg-card border border-border/60 rounded-2xl shadow-elevated overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              
              {results.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {results.map((doctor) => (
                    <Link 
                      key={doctor.id} 
                      href={`/book/${doctor.slug}`}
                      className="flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 ring-1 ring-primary/20">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{doctor.slug}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  {!loading && debouncedQuery && (
                    <p>No se encontraron especialistas con &quot;{debouncedQuery}&quot;.</p>
                  )}
                  {!loading && !debouncedQuery && (
                    <p>Comienza a escribir para ver resultados.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

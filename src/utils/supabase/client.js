import { createBrowserClient } from '@supabase/ssr'

/**
 * Crea una instancia del cliente de Supabase para su uso en el navegador (Client Components).
 * 
 * Utiliza `@supabase/ssr` para inicializar el cliente usando las variables de entorno públicas.
 * Este cliente gestiona automáticamente las cookies de sesión en el navegador.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient} El cliente de Supabase configurado para el lado del cliente.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

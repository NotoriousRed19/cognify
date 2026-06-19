import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Crea una instancia del cliente de Supabase para su uso en el servidor (Server Components, API Routes).
 * 
 * Utiliza `@supabase/ssr` para inicializar el cliente e inyecta dinámicamente
 * las cookies de la petición actual usando `next/headers`. Permite leer y escribir
 * cookies de sesión de forma segura en el entorno del servidor de Next.js.
 * 
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>} El cliente de Supabase configurado para el servidor.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

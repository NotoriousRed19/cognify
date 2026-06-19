import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Manejador de la petición GET para el callback de autenticación (OAuth / Magic Links).
 * 
 * Propósito:
 * Procesar el código temporal (`code`) devuelto por Supabase después de que 
 * un usuario se autentica a través de un proveedor externo (Google) o Magic Link, 
 * intercambiándolo por una sesión válida.
 * 
 * Flujo de ejecución:
 * 1. Extrae los parámetros de la URL (`code`, `action`, `error`, `next`).
 * 2. Si el proveedor de OAuth devuelve un error, redirige al login con el mensaje.
 * 3. Si hay un código, llama a `exchangeCodeForSession` para obtener la sesión del usuario.
 * 4. Si el intercambio falla (código expirado/usado), redirige con mensajes descriptivos.
 * 5. Evalúa si es un usuario "nuevo" o "existente" calculando la diferencia
 *    entre `created_at` y el tiempo actual (ventana de 60 segundos por latencia).
 * 6. Aplica lógica de negocio restrictiva: 
 *    - Bloquea intentos de 'login' de usuarios que no se han registrado previamente.
 *    - Bloquea intentos de 'register' de cuentas que ya existen en la base de datos.
 * 7. Redirige a la ruta definida en `next` (o `/dashboard`) agregando `session_init=true`
 *    para que el frontend limpie estados previos de sesión.
 * 
 * @param {Request} request - Objeto de la petición con los parámetros de búsqueda (query params).
 * @returns {Promise<Response>} Redirección HTTP a la aplicación o a la pantalla de error.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const action = searchParams.get('action')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle OAuth provider errors (e.g., user denied access)
  if (error_param) {
    console.error('[Auth Callback] Provider error:', error_param, error_description)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error_description || 'Error de autenticación con el proveedor.')}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[Auth Callback] Code exchange failed:', error.message, '| code:', code?.substring(0, 8) + '...')
      
      // Provide specific messages based on error type
      let errorMsg = 'El enlace ha expirado o ya fue utilizado. Intenta iniciar sesión con tu contraseña.'
      if (error.message.includes('expired')) {
        errorMsg = 'El enlace de verificación ha expirado. Por favor intenta iniciar sesión nuevamente.'
      } else if (error.message.includes('already been used') || error.message.includes('used')) {
        errorMsg = 'Este enlace ya fue utilizado. Si ya iniciaste sesión, ve al dashboard.'
      }
      
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`)
    }

    if (data?.user) {
      const user = data.user
      const createdAt = new Date(user.created_at).getTime()
      const now = new Date().getTime()
      
      const isNewUser = (now - createdAt) < 60000 // 60s window para tolerar latencia de red
      
      if (action === 'login' && isNewUser) {
        // Cerramos la sesión en las cookies del frontend
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=Esta+cuenta+aún+no+está+registrada`)
      }
      
      if (action === 'register' && !isNewUser) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/register?error=Esta+cuenta+ya+está+registrada`)
      }

      const redirectUrl = new URL(`${origin}${next}`)
      redirectUrl.searchParams.set('session_init', 'true')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // No code parameter at all — this means the callback was hit without OAuth flow
  console.error('[Auth Callback] No code parameter received. Query params:', Object.fromEntries(searchParams.entries()))
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No se recibió código de autenticación. Intenta iniciar sesión nuevamente.')}`)
}


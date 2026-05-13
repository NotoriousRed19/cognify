import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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
      
      const isNewUser = (now - createdAt) < 10000 // created less than 10 seconds ago
      
      if (action === 'login' && isNewUser) {
        // 1. Instanciamos el cliente administrador con poder absoluto
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        
        // 2. Cerramos la sesión en las cookies del frontend
        await supabase.auth.signOut()
        
        // 3. Destruimos completamente al usuario de la base de datos
        if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'coloca_aqui_tu_service_role_key') {
          await supabaseAdmin.auth.admin.deleteUser(user.id)
        }
        
        return NextResponse.redirect(`${origin}/login?error=Esta+cuenta+aún+no+está+registrada`)
      }
      
      if (action === 'register' && !isNewUser) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/register?error=Esta+cuenta+ya+está+registrada`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code parameter at all — this means the callback was hit without OAuth flow
  console.error('[Auth Callback] No code parameter received. Query params:', Object.fromEntries(searchParams.entries()))
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No se recibió código de autenticación. Intenta iniciar sesión nuevamente.')}`)
}


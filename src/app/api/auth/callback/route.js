import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const action = searchParams.get('action')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
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

  // Si no hay código o la verificación falló, redirigimos a login con un mensaje más claro
  // Esto es común con correos de Outlook/Microsoft donde "SafeLinks" consume el token antes que el usuario.
  return NextResponse.redirect(`${origin}/login?error=El+enlace+ha+expirado+o+ya+fue+utilizado.+Intenta+iniciar+sesión+con+tu+contraseña.`)
}

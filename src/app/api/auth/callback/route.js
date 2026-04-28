import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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
      
      const isNewUser = (now - createdAt) < 5000 // created less than 5 seconds ago
      
      if (action === 'login' && isNewUser) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=Esta+cuenta+aún+no+está+registrada`)
      }
      
      if (action === 'register' && !isNewUser) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/register?error=Esta+cuenta+ya+está+registrada`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Ocurrio+un+error+con+la+autenticacion`)
}

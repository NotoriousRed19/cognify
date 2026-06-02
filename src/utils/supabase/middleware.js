import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function updateSession(request) {
  // CRITICAL: Skip middleware processing for the auth callback route.
  // The callback needs to run exchangeCodeForSession() first.
  // If middleware calls getUser() before that, it can corrupt the PKCE flow
  // and cause "link expired" errors.
  if (request.nextUrl.pathname.startsWith('/api/auth/callback')) {
    return NextResponse.next()
  }

  // Redirigir la ruta antigua /admin hacia /dashboard/admin
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/admin'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Definición de rutas y tipos de acceso
  const isAdminPath = pathname.startsWith('/dashboard/admin') || 
                      pathname.startsWith('/admin') || 
                      pathname.startsWith('/api/admin')

  const isPublicApi = pathname.startsWith('/api/auth') || 
                      pathname.startsWith('/api/doctors/search') || 
                      pathname.startsWith('/api/booking');

  const isProtectedPath = pathname.startsWith('/dashboard') || 
                          (pathname.startsWith('/api/') && !isPublicApi)

  const isAuthPath = pathname.startsWith('/login') || 
                     pathname.startsWith('/register') ||
                     pathname === '/'

  // 1. Usuario NO autenticado
  if (!user) {
    if (isAdminPath || isProtectedPath) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // 2. Usuario autenticado
  if (user) {
    const isAdmin = user.email?.toLowerCase() === 'mauriciocotufa@gmail.com'

    // Redirigir de páginas externas de auth (/login, /register) al dashboard correspondiente
    if (isAuthPath) {
      const url = request.nextUrl.clone()
      url.pathname = isAdmin ? '/dashboard/admin' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // Un usuario con rol "Administrador" no debe acceder al panel de usuarios normales directamente
    if (isAdmin && pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/admin'
      return NextResponse.redirect(url)
    }

    // Proteger páginas destinadas a administradores
    if (isAdminPath) {
      if (!isAdmin) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Prohibido: Se requieren privilegios de administrador' }, { status: 403 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        url.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

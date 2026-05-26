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

  const isProtectedPath = pathname.startsWith('/dashboard') || 
                          (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth'))

  const isAuthPath = pathname.startsWith('/login') || 
                     pathname.startsWith('/register')

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
    const adminEmail = process.env.ADMIN_EMAIL
    const isEmailAdmin = adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()

    // Auto-promocionar al usuario si su email coincide con el ADMIN_EMAIL y no tiene el rol de Administrador en sus metadatos
    if (isEmailAdmin && user.user_metadata?.role !== 'Administrador') {
      try {
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        // Actualizar metadatos del usuario en Supabase Auth
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, role: 'Administrador' },
          app_metadata: { ...user.app_metadata, role: 'Administrador' }
        })
        // Intentar actualizar la columna role en la tabla pública User
        await supabaseAdmin
          .from('User')
          .update({ role: 'Administrador' })
          .eq('id', user.id)

        console.log(`[Middleware] Auto-promocionando a ${user.email} como Administrador basado en ADMIN_EMAIL`)
      } catch (err) {
        console.error('[Middleware] Error en la auto-promoción de admin:', err)
      }
    }

    const userRole = user.app_metadata?.role || user.user_metadata?.role || 'Usuario'
    const isAdmin = userRole === 'Administrador' || isEmailAdmin

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

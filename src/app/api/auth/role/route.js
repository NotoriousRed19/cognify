import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    // 1. Verificar autenticación del usuario actual
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener el nuevo rol del cuerpo de la petición
    const body = await request.json()
    const { role } = body

    if (!role || (role !== 'Administrador' && role !== 'Usuario')) {
      return NextResponse.json({ error: 'Rol inválido. Debe ser Administrador o Usuario.' }, { status: 400 })
    }

    // 3. Crear cliente administrador con service_role
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 4. Actualizar el rol en la tabla pública "User" (intentar, capturando error si la columna no existe)
    let dbUpdateSuccess = false
    let dbErrorMsg = ''
    try {
      const { error: dbError } = await supabaseAdmin
        .from('User')
        .update({ role })
        .eq('id', user.id)

      if (dbError) {
        console.error('[Role API] Error updating User table:', dbError.message)
        dbErrorMsg = dbError.message
      } else {
        dbUpdateSuccess = true
        console.log('[Role API] Successfully updated role in User table to:', role)
      }
    } catch (err) {
      console.error('[Role API] Exception updating User table:', err)
      dbErrorMsg = err.message
    }

    // 5. Actualizar el metadata del usuario en Supabase Auth
    // Actualizamos tanto user_metadata como app_metadata para garantizar que esté disponible en todas partes
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: { ...user.user_metadata, role },
        app_metadata: { ...user.app_metadata, role }
      }
    )

    if (metadataError) {
      console.error('[Role API] Error updating auth metadata:', metadataError.message)
      return NextResponse.json({
        error: 'Error al actualizar metadatos de autenticación',
        details: metadataError.message
      }, { status: 500 })
    }

    console.log('[Role API] Successfully updated auth metadata role to:', role)

    return NextResponse.json({
      success: true,
      role,
      dbUpdated: dbUpdateSuccess,
      dbError: dbErrorMsg || null
    })
  } catch (error) {
    console.error('[Role API] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 })
  }
}

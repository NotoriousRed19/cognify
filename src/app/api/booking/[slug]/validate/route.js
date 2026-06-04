import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request, { params }) {
  const { slug } = await params;
  
  try {
    const { identificacion, celular } = await request.json();
    
    if (!identificacion && !celular) {
      return NextResponse.json({ error: "Datos faltantes" }, { status: 400 });
    }

    // Cliente admin para saltarse el RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Obtener datos del doctor
    const { data: doctorData } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!doctorData) {
      return NextResponse.json({ error: "Doctor no encontrado" }, { status: 404 });
    }

    const safeIdentificacion = identificacion ? identificacion.replace(/"/g, '') : '';
    const safeCelular = celular ? celular.replace(/"/g, '') : '';

    const { data: existingPatient } = await supabaseAdmin
      .from('Patient')
      .select('id')
      .eq('doctor_id', doctorData.id)
      .or(`identificacion.eq."${safeIdentificacion}",celular.eq."${safeCelular}"`)
      .limit(1)
      .maybeSingle();

    if (existingPatient) {
      return NextResponse.json({ exists: true });
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("[VALIDATE ERROR]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

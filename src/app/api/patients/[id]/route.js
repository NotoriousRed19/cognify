import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Con Supabase JS, podemos usar select anidado si configuramos las FK correctamente
    // Si la DB tiene relaciones, podemos hacer "*, TherapySession(*), Appointment(*)"
    // Vamos a hacer consultas paralelas ya que RLS protege todo.
    const [patientRes, sessionsRes, appointmentsRes] = await Promise.all([
      supabase.from("Patient").select("*").eq("id", id).single(),
      supabase.from("TherapySession").select("*").eq("patient_id", id).order("fecha_sesion", { ascending: false }),
      supabase.from("Appointment").select("*").eq("patient_id", id).order("fecha_inicio", { ascending: false })
    ]);

    if (patientRes.error) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    const patient = {
      ...patientRes.data,
      sesiones: sessionsRes.data || [],
      appointments: appointmentsRes.data || []
    };

    return NextResponse.json({ patient }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_GET]", error);
    return NextResponse.json(
      { error: "Error de servidor al obtener detalles del paciente" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const body = await request.json();

    const allowedFields = ["nombre", "identificacion", "celular", "fecha_nacimiento", "sexo", "nacionalidad", "historial_medico", "medicacion"];
    const data = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === "fecha_nacimiento" && body[field]) {
          const d = new Date(body[field]);
          if (isNaN(d.getTime())) return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });
          data[field] = d.toISOString();
        } else {
          data[field] = body[field] || null;
        }
      }
    }

    const { data: updated, error } = await supabase
      .from("Patient")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ patient: updated }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_PATCH]", error);
    return NextResponse.json(
      { error: "Error al actualizar el paciente" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, supabase, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("Patient")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Paciente no encontrado o acceso denegado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Paciente eliminado exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("[PATIENT_DETAIL_DELETE]", error);
    return NextResponse.json(
      { error: "Error al eliminar el paciente" },
      { status: 500 }
    );
  }
}

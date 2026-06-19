import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";

/**
 * Manejador de la petición GET para consultar la disponibilidad de horarios de un doctor.
 * 
 * Propósito:
 * Obtener y calcular los "slots" (bloques de tiempo) disponibles para que un paciente
 * pueda agendar una cita en una fecha específica, basándose en el horario de 
 * disponibilidad del profesional y las citas ya ocupadas.
 * 
 * Flujo de ejecución:
 * 1. Extrae el `slug` del doctor y la fecha consultada (`dateQuery`).
 * 2. Utiliza la función RPC `rpc_get_doctor_slots_info` para recuperar en una sola consulta
 *    la disponibilidad semanal, las citas existentes y el estado de las reservas.
 * 3. Valida que el doctor tenga la funcionalidad de reservas activada (`booking_enabled`).
 * 4. Obtiene la información de precios (`pricing_info`) para enviarla al cliente.
 * 5. Genera todos los bloques teóricos de 1 hora según el horario base configurado para ese día de la semana.
 * 6. Filtra los bloques que se solapen (overlap) con citas ya confirmadas o en revisión.
 * 7. Aplica una regla estricta de tiempo de gracia: descarta los bloques que estén a menos de 2 horas de la hora UTC actual.
 * 
 * @param {Request} request - Petición entrante, incluye el parámetro de búsqueda `?date=yyyy-mm-dd`.
 * @param {Object} context - Objeto con los parámetros de la URL (`slug`).
 * @returns {Promise<Response>} Respuesta JSON con los horarios calculados (`slots`) y precios (`pricing_info`).
 */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const dateQuery = searchParams.get("date"); // yyyy-mm-dd

  if (!dateQuery || !/^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
    return NextResponse.json({ error: "Falta la fecha o formato inválido (date=yyyy-mm-dd)" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    
    // Default a una zona horaria, asumiendo America/Caracas para el doctor por ahora
    const doctorTimeZone = "America/Caracas";

    // Configuramos inicio y fin del día en la zona horaria del doctor
    const startOfDayUtc = fromZonedTime(`${dateQuery}T00:00:00`, doctorTimeZone);
    const endOfDayUtc = fromZonedTime(`${dateQuery}T23:59:59`, doctorTimeZone);
    
    const { data: doctorInfo, error: rpcError } = await supabase.rpc("rpc_get_doctor_slots_info", {
      p_slug: slug,
      p_start_date: startOfDayUtc.toISOString(),
      p_end_date: endOfDayUtc.toISOString()
    });

    if (rpcError) {
      console.error("[SLOTS RPC ERROR]", rpcError);
      return NextResponse.json({ error: "Doctor no encontrado o error interno" }, { status: 404 });
    }

    if (!doctorInfo.booking_enabled) {
      return NextResponse.json({ error: "Las reservas están deshabilitadas para este doctor" }, { status: 403 });
    }

    // Obtener pricing_info
    const { data: userData } = await supabase
      .from('User')
      .select('pricing_info')
      .eq('id', doctorInfo.doctor_id)
      .single();

    const pricingInfo = userData?.pricing_info || {};

    // Determinar día de la semana (0 = Domingo, 6 = Sábado) basado en el dateQuery
    const targetDate = new Date(`${dateQuery}T12:00:00`);
    const dayOfWeek = targetDate.getDay();

    const availabilityBlocks = doctorInfo.availability.filter(b => b.day_of_week === dayOfWeek);

    if (!availabilityBlocks || availabilityBlocks.length === 0) {
      return NextResponse.json({ slots: [], pricing_info: pricingInfo }); // No trabaja ese día
    }

    // Generar todos los slots crudos posibles (cada 60 min por defecto)
    let allSlots = [];
    for (const block of availabilityBlocks) {
      const [startH, startM] = block.start_time.split(':').map(Number);
      const [endH, endM] = block.end_time.split(':').map(Number);
      
      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      while (currentMinutes + 60 <= endMinutes) {
        const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
        const m = (currentMinutes % 60).toString().padStart(2, '0');
        allSlots.push(`${h}:${m}`);
        currentMinutes += 60;
      }
    }

    // Convertir citas ocupadas a milisegundos para comprobación de rango
    const appointments = doctorInfo.appointments || [];
    const occupiedRanges = appointments.map(appt => {
      const startStr = appt.fecha_inicio.replace(' ', 'T') + (appt.fecha_inicio.includes('Z') ? '' : 'Z');
      const endStr = appt.fecha_fin.replace(' ', 'T') + (appt.fecha_fin.includes('Z') ? '' : 'Z');
      return {
        start: new Date(startStr).getTime(),
        end: new Date(endStr).getTime()
      };
    });

    const nowUtc = new Date().getTime(); // Hora UTC actual

    // Filtrar slots
    const availableSlots = allSlots.filter(slotTime => {
      // Calcular la fecha/hora UTC del inicio del slot propuesto
      const slotStartUtc = fromZonedTime(`${dateQuery}T${slotTime}:00`, doctorTimeZone).getTime();
      
      // Asumimos citas de 60 minutos
      const slotEndUtc = slotStartUtc + (60 * 60 * 1000);

      // 1. Verificar colisión real (Overlap)
      // superposición = existente_inicio < nuevo_fin AND existente_fin > nuevo_inicio
      const hasOverlap = occupiedRanges.some(range => {
        return (range.start < slotEndUtc && range.end > slotStartUtc);
      });

      if (hasOverlap) return false;

      // 2. Regla estricta de 2 horas de antelación
      const twoHoursFromNowUtc = nowUtc + (2 * 60 * 60 * 1000);
      if (slotStartUtc <= twoHoursFromNowUtc) {
        return false;
      }

      return true;
    });

    return NextResponse.json({ slots: availableSlots, pricing_info: pricingInfo });
    
  } catch (err) {
    console.error("[SLOTS API ERROR]", err);
    return NextResponse.json({ error: "Error interno procesando horarios" }, { status: 500 });
  }
}

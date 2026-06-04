-- Fix: Evitar que citas con estado 'CANCELADA' pero status 'CONFIRMED' bloqueen slots

CREATE OR REPLACE FUNCTION public.rpc_get_doctor_slots_info(
    p_slug TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_doctor_id TEXT;
    v_booking_enabled BOOLEAN;
    v_payment_instructions TEXT;
    v_availability JSONB;
    v_appointments JSONB;
    v_result JSONB;
BEGIN
    SELECT id, booking_enabled, payment_instructions 
    INTO v_doctor_id, v_booking_enabled, v_payment_instructions
    FROM public."User"
    WHERE slug = p_slug
    LIMIT 1;

    IF v_doctor_id IS NULL THEN
        RAISE EXCEPTION 'Doctor no encontrado';
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'day_of_week', day_of_week,
            'start_time', start_time,
            'end_time', end_time
        )
    ), '[]'::jsonb)
    INTO v_availability
    FROM public."Availability"
    WHERE doctor_id = v_doctor_id;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'fecha_inicio', fecha_inicio,
            'fecha_fin', fecha_fin,
            'status', COALESCE(status, estado) 
        )
    ), '[]'::jsonb)
    INTO v_appointments
    FROM public."Appointment"
    WHERE doctor_id = v_doctor_id
      AND fecha_inicio >= p_start_date
      AND fecha_inicio <= p_end_date
      AND estado != 'CANCELADA' -- Asegurar que las canceladas jamás cuenten
      AND COALESCE(status, '') != 'REJECTED' -- Asegurar que las rechazadas tampoco
      AND (
          (COALESCE(status, estado) = 'CONFIRMED')
          OR 
          (COALESCE(status, estado) = 'PENDING_APPROVAL' AND (expires_at IS NULL OR expires_at > NOW()))
          OR
          (COALESCE(status, estado) = 'AGENDADA')
          OR
          (COALESCE(status, estado) = 'COMPLETADA')
      );

    v_result := jsonb_build_object(
        'doctor_id', v_doctor_id,
        'booking_enabled', v_booking_enabled,
        'payment_instructions', v_payment_instructions,
        'availability', v_availability,
        'appointments', v_appointments
    );

    RETURN v_result;
END;
$$;

-- Restablecer permisos seguros
REVOKE EXECUTE ON FUNCTION public.rpc_get_doctor_slots_info(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_get_doctor_slots_info(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, public, authenticated;

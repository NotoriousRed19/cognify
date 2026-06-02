-- =================================================================================
-- Cognify — Migración 011: Booking Engine Architecture Fixes (Post-Phase 4)
-- =================================================================================

-- 1. Eliminar política insegura reportada por el DB Optimizer
DROP POLICY IF EXISTS "appointment_public_insert" ON public."Appointment";

-- 2. Corregir política cruzada de actualizaciones
DROP POLICY IF EXISTS "appointment_update" ON public."Appointment";
CREATE POLICY "appointment_update" ON public."Appointment"
FOR UPDATE TO authenticated
USING (doctor_id = (select auth.uid()::text) AND (patient_id IS NULL OR patient_id IN (SELECT id FROM public."Patient" WHERE doctor_id = (select auth.uid()::text))))
WITH CHECK (doctor_id = (select auth.uid()::text));

-- =================================================================================
-- RE-CREACIÓN DE RPCs CON FIXES DE SEGURIDAD Y CONCURRENCIA
-- =================================================================================

-- 3. `rpc_get_doctor_slots_info`
-- Fix: SET search_path, Revocar ejecución pública
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

-- 4. `rpc_request_appointment`
-- Fix: FOR UPDATE lock, Overlap Logic, SET search_path, Revocar ejecución pública
CREATE OR REPLACE FUNCTION public.rpc_request_appointment(
    p_slug TEXT,
    p_fecha_inicio TIMESTAMPTZ,
    p_fecha_fin TIMESTAMPTZ,
    p_guest_name TEXT,
    p_guest_contact TEXT,
    p_guest_details JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_doctor_id TEXT;
    v_booking_enabled BOOLEAN;
    v_conflict_count INT;
    v_new_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Obtenemos y bloqueamos al doctor para evitar colisiones
    SELECT id, booking_enabled INTO v_doctor_id, v_booking_enabled
    FROM public."User"
    WHERE slug = p_slug
    FOR UPDATE
    LIMIT 1;

    IF v_doctor_id IS NULL THEN
        RAISE EXCEPTION 'Doctor no encontrado';
    END IF;

    IF NOT v_booking_enabled THEN
        RAISE EXCEPTION 'Reservas deshabilitadas';
    END IF;

    -- Validar superposición correcta: (inicio_existente < fin_nuevo AND fin_existente > inicio_nuevo)
    SELECT count(*)
    INTO v_conflict_count
    FROM public."Appointment"
    WHERE doctor_id = v_doctor_id
      AND fecha_inicio < p_fecha_fin
      AND fecha_fin > p_fecha_inicio
      AND (
          (COALESCE(status, estado) = 'CONFIRMED')
          OR 
          (COALESCE(status, estado) = 'PENDING_APPROVAL' AND (expires_at IS NULL OR expires_at > NOW()))
          OR
          (COALESCE(status, estado) = 'AGENDADA')
          OR
          (COALESCE(status, estado) = 'COMPLETADA')
      );

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'El horario ya no está disponible (solapamiento detectado)';
    END IF;

    v_new_id := gen_random_uuid();
    v_expires_at := NOW() + interval '2 hours';

    INSERT INTO public."Appointment" (
        id, doctor_id, patient_id, fecha_inicio, fecha_fin, 
        titulo, estado, status, source, 
        guest_name, guest_contact, guest_details, expires_at, "updatedAt"
    ) VALUES (
        v_new_id, v_doctor_id, NULL, p_fecha_inicio, p_fecha_fin,
        'Consulta web', 'AGENDADA', 'PENDING_APPROVAL', 'PUBLIC',
        p_guest_name, p_guest_contact, p_guest_details, v_expires_at, NOW()
    );

    RETURN jsonb_build_object('success', true, 'appointment_id', v_new_id);
END;
$$;


-- 5. `rpc_approve_appointment`
-- Fix: Validación auth.uid(), SET search_path, Revocar ejecución pública
CREATE OR REPLACE FUNCTION public.rpc_approve_appointment(
    p_appointment_id UUID,
    p_doctor_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appt RECORD;
    v_patient_id UUID;
    v_fecha_nacimiento TIMESTAMP;
BEGIN
    -- Security Fix: Solo el doctor autenticado puede ejecutar esto
    IF auth.uid()::text != p_doctor_id THEN
        RAISE EXCEPTION 'Acceso denegado. Permisos insuficientes.';
    END IF;

    SELECT * INTO v_appt
    FROM public."Appointment"
    WHERE id = p_appointment_id AND doctor_id = p_doctor_id
    FOR UPDATE; 

    IF v_appt IS NULL THEN
        RAISE EXCEPTION 'Cita no encontrada o acceso denegado';
    END IF;

    IF COALESCE(v_appt.status, v_appt.estado) != 'PENDING_APPROVAL' THEN
        RAISE EXCEPTION 'La cita no está pendiente de aprobación';
    END IF;

    v_patient_id := gen_random_uuid();
    
    BEGIN
        v_fecha_nacimiento := (v_appt.guest_details->>'fecha_nacimiento')::TIMESTAMP;
    EXCEPTION WHEN OTHERS THEN
        v_fecha_nacimiento := NULL;
    END;
    
    INSERT INTO public."Patient" (
        id, doctor_id, nombre, identificacion, celular, fecha_nacimiento, nacionalidad, sexo
    ) VALUES (
        v_patient_id, 
        p_doctor_id, 
        TRIM(COALESCE(v_appt.guest_details->>'nombre', v_appt.guest_name) || ' ' || COALESCE(v_appt.guest_details->>'apellido', '')),
        v_appt.guest_details->>'identificacion',
        COALESCE(v_appt.guest_details->>'celular', v_appt.guest_contact),
        v_fecha_nacimiento,
        v_appt.guest_details->>'nacionalidad',
        v_appt.guest_details->>'sexo'
    );

    UPDATE public."Appointment"
    SET patient_id = v_patient_id,
        status = 'CONFIRMED',
        estado = 'AGENDADA', 
        "updatedAt" = NOW()
    WHERE id = p_appointment_id;

    RETURN jsonb_build_object('success', true, 'patient_id', v_patient_id);
END;
$$;


-- 6. `rpc_update_availability`
-- Fix: SET search_path, Revocar ejecución pública
CREATE OR REPLACE FUNCTION public.rpc_update_availability(
    p_doctor_id TEXT,
    p_blocks JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    block JSONB;
BEGIN
    IF auth.uid()::text != p_doctor_id THEN
        RAISE EXCEPTION 'Acceso denegado: Solo el doctor puede modificar su horario';
    END IF;

    DELETE FROM public."Availability"
    WHERE doctor_id = p_doctor_id;

    IF jsonb_array_length(p_blocks) > 0 THEN
        FOR block IN SELECT * FROM jsonb_array_elements(p_blocks)
        LOOP
            INSERT INTO public."Availability" (
                doctor_id, day_of_week, start_time, end_time, "createdAt", "updatedAt"
            ) VALUES (
                p_doctor_id, 
                (block->>'day_of_week')::INTEGER, 
                (block->>'start_time')::TIME, 
                (block->>'end_time')::TIME,
                NOW(), NOW()
            );
        END LOOP;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- =================================================================================
-- REVOCAR PERMISOS ANONIMOS Y PUBLICOS A FUNCIONES SECURITY DEFINER
-- =================================================================================
REVOKE EXECUTE ON FUNCTION public.rpc_get_doctor_slots_info(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_request_appointment(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, JSONB) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_approve_appointment(UUID, TEXT) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_update_availability(TEXT, JSONB) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.rpc_get_doctor_slots_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_request_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_approve_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_availability TO authenticated;
-- (Note: Since we use these from serverless functions via service role or admin client for public routes, 
-- service_role still has access. For the public endpoints, we call them with service_role)

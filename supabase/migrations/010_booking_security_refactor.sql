-- =================================================================================
-- Cognify — Migración 010: Security and RPC Refactoring (Pre-Phase 4)
-- =================================================================================

-- 1. `rpc_get_doctor_slots_info`
-- Returns doctor configuration and their availability, plus any blocking appointments.
-- We use SECURITY DEFINER to bypass RLS on User and Appointment.
CREATE OR REPLACE FUNCTION public.rpc_get_doctor_slots_info(
    p_slug TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_doctor_id TEXT;
    v_booking_enabled BOOLEAN;
    v_payment_instructions TEXT;
    v_availability JSONB;
    v_appointments JSONB;
    v_result JSONB;
BEGIN
    -- 1. Find doctor
    SELECT id, booking_enabled, payment_instructions 
    INTO v_doctor_id, v_booking_enabled, v_payment_instructions
    FROM public."User"
    WHERE slug = p_slug
    LIMIT 1;

    IF v_doctor_id IS NULL THEN
        RAISE EXCEPTION 'Doctor no encontrado';
    END IF;

    -- 2. Get their availability (weekly schedule)
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

    -- 3. Get blocking appointments in range
    -- Excludes REJECTED and CANCELADA. Includes CONFIRMED and active PENDING_APPROVAL.
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


-- 2. `rpc_request_appointment`
-- Checks availability atomically and inserts.
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
AS $$
DECLARE
    v_doctor_id TEXT;
    v_booking_enabled BOOLEAN;
    v_conflict_count INT;
    v_new_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 1. Get Doctor
    SELECT id, booking_enabled INTO v_doctor_id, v_booking_enabled
    FROM public."User"
    WHERE slug = p_slug
    LIMIT 1;

    IF v_doctor_id IS NULL THEN
        RAISE EXCEPTION 'Doctor no encontrado';
    END IF;

    IF NOT v_booking_enabled THEN
        RAISE EXCEPTION 'Reservas deshabilitadas';
    END IF;

    -- 2. Check collisions (Lock for concurrency)
    SELECT count(*)
    INTO v_conflict_count
    FROM public."Appointment"
    WHERE doctor_id = v_doctor_id
      AND fecha_inicio = p_fecha_inicio
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
        RAISE EXCEPTION 'El horario ya no está disponible';
    END IF;

    -- 3. Insert
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


-- 3. `rpc_approve_appointment`
CREATE OR REPLACE FUNCTION public.rpc_approve_appointment(
    p_appointment_id UUID,
    p_doctor_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appt RECORD;
    v_patient_id UUID;
    v_fecha_nacimiento TIMESTAMP;
BEGIN
    -- 1. Find the appointment
    SELECT * INTO v_appt
    FROM public."Appointment"
    WHERE id = p_appointment_id AND doctor_id = p_doctor_id
    FOR UPDATE; -- Lock the row

    IF v_appt IS NULL THEN
        RAISE EXCEPTION 'Cita no encontrada o acceso denegado';
    END IF;

    IF COALESCE(v_appt.status, v_appt.estado) != 'PENDING_APPROVAL' THEN
        RAISE EXCEPTION 'La cita no está pendiente de aprobación';
    END IF;

    -- 2. Create Patient
    v_patient_id := gen_random_uuid();
    
    -- Manejo seguro de fecha de nacimiento si viene vacía
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

    -- 3. Update Appointment
    UPDATE public."Appointment"
    SET patient_id = v_patient_id,
        status = 'CONFIRMED',
        estado = 'AGENDADA', -- Fallback for v1 compatibility
        "updatedAt" = NOW()
    WHERE id = p_appointment_id;

    RETURN jsonb_build_object('success', true, 'patient_id', v_patient_id);
END;
$$;


-- 4. `rpc_update_availability`
CREATE OR REPLACE FUNCTION public.rpc_update_availability(
    p_doctor_id TEXT,
    p_blocks JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    block JSONB;
BEGIN
    -- Verify the caller matches the doctor ID (extra security)
    IF auth.uid()::text != p_doctor_id THEN
        RAISE EXCEPTION 'Acceso denegado: Solo el doctor puede modificar su horario';
    END IF;

    -- 1. Delete old
    DELETE FROM public."Availability"
    WHERE doctor_id = p_doctor_id;

    -- 2. Insert new
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

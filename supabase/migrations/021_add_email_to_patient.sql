-- =================================================================================
-- Cognify — Migración 021: Add Email to Patient
-- =================================================================================

-- 1. Añadir la columna email a la tabla Patient
ALTER TABLE public."Patient" ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Crear un UNIQUE INDEX idx_patient_email_doctor en (doctor_id, email) WHERE email IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_email_doctor 
ON public."Patient" (doctor_id, email) 
WHERE email IS NOT NULL;

-- 3. Actualizar la función rpc_approve_appointment
CREATE OR REPLACE FUNCTION public.rpc_approve_appointment(p_appointment_id text, p_doctor_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_appt RECORD;
    v_patient_id TEXT;
    v_fecha_nacimiento TIMESTAMP;
    v_identificacion TEXT;
    v_celular TEXT;
    v_email TEXT;
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

    v_identificacion := v_appt.guest_details->>'identificacion';
    v_celular := COALESCE(v_appt.guest_details->>'celular', v_appt.guest_contact);
    v_email := v_appt.guest_details->>'email';

    -- Check if patient already exists by identificacion, celular, or email for this doctor
    SELECT id INTO v_patient_id 
    FROM public."Patient" 
    WHERE doctor_id = p_doctor_id 
      AND (
        (identificacion = v_identificacion AND identificacion IS NOT NULL AND identificacion != '')
        OR 
        (celular = v_celular AND celular IS NOT NULL AND celular != '')
        OR 
        (email = v_email AND email IS NOT NULL AND email != '')
      )
    LIMIT 1;

    IF v_patient_id IS NULL THEN
        v_patient_id := gen_random_uuid()::text;
        
        BEGIN
            v_fecha_nacimiento := (v_appt.guest_details->>'fecha_nacimiento')::TIMESTAMP;
        EXCEPTION WHEN OTHERS THEN
            v_fecha_nacimiento := NULL;
        END;
        
        INSERT INTO public."Patient" (
            id, doctor_id, nombre, identificacion, celular, email, fecha_nacimiento, nacionalidad, sexo, "updatedAt"
        ) VALUES (
            v_patient_id, 
            p_doctor_id, 
            TRIM(COALESCE(v_appt.guest_details->>'nombre', v_appt.guest_name) || ' ' || COALESCE(v_appt.guest_details->>'apellido', '')),
            v_identificacion,
            v_celular,
            v_email,
            v_fecha_nacimiento,
            v_appt.guest_details->>'nacionalidad',
            v_appt.guest_details->>'sexo',
            NOW()
        );
    END IF;

    UPDATE public."Appointment"
    SET patient_id = v_patient_id,
        status = 'CONFIRMED',
        estado = 'AGENDADA', 
        "updatedAt" = NOW()
    WHERE id = p_appointment_id;

    RETURN jsonb_build_object('success', true, 'patient_id', v_patient_id);
END;
$function$;

-- 4. Restaurar permisos explícitamente para cumplir defense-in-depth (Migración 017)
REVOKE EXECUTE ON FUNCTION public.rpc_approve_appointment(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_approve_appointment(text, text) TO authenticated;

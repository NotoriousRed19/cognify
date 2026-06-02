-- =================================================================================
-- Cognify — Migración 015: Corrección de RPC Approve Appointment
-- =================================================================================
-- Se corrige el tipo de dato de p_appointment_id de uuid a text para coincidir
-- con el esquema de la tabla Appointment. Además, se añade la lógica para evitar
-- duplicados de pacientes buscando por celular o identificación, y se añade
-- el campo obligatorio "updatedAt".

-- 1. Eliminar la versión antigua que causaba conflicto de tipos (uuid vs text)
DROP FUNCTION IF EXISTS public.rpc_approve_appointment(uuid, text);

-- 2. Crear la versión actualizada
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

    -- Check if patient already exists by identificacion or celular for this doctor
    SELECT id INTO v_patient_id 
    FROM public."Patient" 
    WHERE doctor_id = p_doctor_id 
      AND (
        (identificacion = v_identificacion AND identificacion IS NOT NULL AND identificacion != '')
        OR 
        (celular = v_celular AND celular IS NOT NULL AND celular != '')
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
            id, doctor_id, nombre, identificacion, celular, fecha_nacimiento, nacionalidad, sexo, "updatedAt"
        ) VALUES (
            v_patient_id, 
            p_doctor_id, 
            TRIM(COALESCE(v_appt.guest_details->>'nombre', v_appt.guest_name) || ' ' || COALESCE(v_appt.guest_details->>'apellido', '')),
            v_identificacion,
            v_celular,
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

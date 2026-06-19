-- =================================================================================
-- Cognify — Migración 005: Limpieza y consolidación de políticas RLS
-- =================================================================================
-- Elimina las políticas duplicadas creadas por 001 y 003, y establece
-- un set limpio y definitivo de políticas por operación.
-- =================================================================================

-- ── Limpiar políticas existentes de Patient ──────────────────────────────────────
DROP POLICY IF EXISTS "Doctors can view their own patients"         ON public."Patient";
DROP POLICY IF EXISTS "Doctors can insert their own patients"       ON public."Patient";
DROP POLICY IF EXISTS "Doctors can update their own patients"       ON public."Patient";
DROP POLICY IF EXISTS "Doctors can delete their own patients"       ON public."Patient";
DROP POLICY IF EXISTS "Los doctores solo pueden ver sus propios pacientes" ON public."Patient";

-- ── Limpiar políticas existentes de Appointment ──────────────────────────────────
DROP POLICY IF EXISTS "Doctors can view their own appointments"     ON public."Appointment";
DROP POLICY IF EXISTS "Doctors can insert their own appointments"   ON public."Appointment";
DROP POLICY IF EXISTS "Doctors can update their own appointments"   ON public."Appointment";
DROP POLICY IF EXISTS "Doctors can delete their own appointments"   ON public."Appointment";
DROP POLICY IF EXISTS "Los doctores solo pueden ver sus propias citas" ON public."Appointment";

-- ── Limpiar políticas existentes de TherapySession ───────────────────────────────
DROP POLICY IF EXISTS "Doctors can view sessions of their patients"   ON public."TherapySession";
DROP POLICY IF EXISTS "Doctors can insert sessions for their patients" ON public."TherapySession";
DROP POLICY IF EXISTS "Doctors can update sessions of their patients" ON public."TherapySession";
DROP POLICY IF EXISTS "Doctors can delete sessions of their patients" ON public."TherapySession";
DROP POLICY IF EXISTS "Los doctores solo pueden ver sesiones de sus pacientes" ON public."TherapySession";

-- ── Limpiar políticas existentes de User ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"                 ON public."User";
DROP POLICY IF EXISTS "Los usuarios solo pueden ver su propio perfil" ON public."User";
-- Conservar la política de service_role si existe (creada en 004)

-- =================================================================================
-- POLÍTICAS DEFINITIVAS — Una por operación, una sola fuente de verdad
-- =================================================================================

-- ── Patient ──────────────────────────────────────────────────────────────────────
CREATE POLICY "patient_select" ON public."Patient"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = doctor_id);

CREATE POLICY "patient_insert" ON public."Patient"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = doctor_id);

CREATE POLICY "patient_update" ON public."Patient"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = doctor_id)
  WITH CHECK (auth.uid()::text = doctor_id);

CREATE POLICY "patient_delete" ON public."Patient"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = doctor_id);

-- ── Appointment ──────────────────────────────────────────────────────────────────
CREATE POLICY "appointment_select" ON public."Appointment"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = doctor_id);

CREATE POLICY "appointment_insert" ON public."Appointment"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = doctor_id);

CREATE POLICY "appointment_update" ON public."Appointment"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = doctor_id)
  WITH CHECK (auth.uid()::text = doctor_id);

CREATE POLICY "appointment_delete" ON public."Appointment"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = doctor_id);

-- ── TherapySession (acceso indirecto via Patient) ────────────────────────────────
CREATE POLICY "therapy_session_select" ON public."TherapySession"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Patient" p
      WHERE p.id = public."TherapySession".patient_id
        AND p.doctor_id = auth.uid()::text
    )
  );

CREATE POLICY "therapy_session_insert" ON public."TherapySession"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Patient" p
      WHERE p.id = public."TherapySession".patient_id
        AND p.doctor_id = auth.uid()::text
    )
  );

CREATE POLICY "therapy_session_update" ON public."TherapySession"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Patient" p
      WHERE p.id = public."TherapySession".patient_id
        AND p.doctor_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Patient" p
      WHERE p.id = public."TherapySession".patient_id
        AND p.doctor_id = auth.uid()::text
    )
  );

CREATE POLICY "therapy_session_delete" ON public."TherapySession"
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Patient" p
      WHERE p.id = public."TherapySession".patient_id
        AND p.doctor_id = auth.uid()::text
    )
  );

-- ── User (solo lectura del propio perfil) ────────────────────────────────────────
CREATE POLICY "user_select" ON public."User"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id);

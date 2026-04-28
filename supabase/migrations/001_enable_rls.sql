-- ═══════════════════════════════════════════════════════════════════════════════
-- Cognify — Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Ejecutar este script en el SQL Editor del Dashboard de Supabase.
--
-- NOTA: Prisma se conecta como role "postgres" (superuser) y bypasses RLS.
-- Estas políticas protegen la Data API de Supabase (PostgREST) como capa
-- adicional de defensa en profundidad.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- ══════════════════════════════════════════════════

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TherapySession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════
-- 2. POLÍTICAS PARA "Patient"
--    Solo el doctor dueño puede CRUD sus pacientes
-- ══════════════════════════════════════════════════

CREATE POLICY "Doctors can view their own patients"
  ON "Patient" FOR SELECT
  TO authenticated
  USING (doctor_id = (SELECT auth.uid()::text));

CREATE POLICY "Doctors can insert their own patients"
  ON "Patient" FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id = (SELECT auth.uid()::text));

CREATE POLICY "Doctors can update their own patients"
  ON "Patient" FOR UPDATE
  TO authenticated
  USING (doctor_id = (SELECT auth.uid()::text))
  WITH CHECK (doctor_id = (SELECT auth.uid()::text));

CREATE POLICY "Doctors can delete their own patients"
  ON "Patient" FOR DELETE
  TO authenticated
  USING (doctor_id = (SELECT auth.uid()::text));


-- ══════════════════════════════════════════════════
-- 3. POLÍTICAS PARA "Appointment"
--    Solo el doctor dueño puede CRUD sus citas
-- ══════════════════════════════════════════════════

CREATE POLICY "Doctors can view their own appointments"
  ON "Appointment" FOR SELECT
  TO authenticated
  USING (doctor_id = (SELECT auth.uid()::text));

CREATE POLICY "Doctors can insert their own appointments"
  ON "Appointment" FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id = (SELECT auth.uid()::text));

CREATE POLICY "Doctors can update their own appointments"
  ON "Appointment" FOR UPDATE
  TO authenticated
  USING (doctor_id = (SELECT auth.uid()::text))
  WITH CHECK (doctor_id = (SELECT auth.uid()::text));

CREATE POLICY "Doctors can delete their own appointments"
  ON "Appointment" FOR DELETE
  TO authenticated
  USING (doctor_id = (SELECT auth.uid()::text));


-- ══════════════════════════════════════════════════
-- 4. POLÍTICAS PARA "TherapySession"
--    Acceso indirecto via ownership del paciente
-- ══════════════════════════════════════════════════

CREATE POLICY "Doctors can view sessions of their patients"
  ON "TherapySession" FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM "Patient"
      WHERE doctor_id = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Doctors can insert sessions for their patients"
  ON "TherapySession" FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM "Patient"
      WHERE doctor_id = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Doctors can update sessions of their patients"
  ON "TherapySession" FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM "Patient"
      WHERE doctor_id = (SELECT auth.uid()::text)
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM "Patient"
      WHERE doctor_id = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Doctors can delete sessions of their patients"
  ON "TherapySession" FOR DELETE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM "Patient"
      WHERE doctor_id = (SELECT auth.uid()::text)
    )
  );


-- ══════════════════════════════════════════════════
-- 5. POLÍTICAS PARA TABLAS DE NextAuth
--    Gestionadas server-side por NextAuth via Prisma.
--    Bloqueamos acceso desde la Data API.
-- ══════════════════════════════════════════════════

-- "User": Solo puede verse a sí mismo
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()::text));

-- "Account": Solo visible por el propietario
CREATE POLICY "Users can view own accounts"
  ON "Account" FOR SELECT
  TO authenticated
  USING ("userId" = (SELECT auth.uid()::text));

-- "Session": Solo visible por el propietario
CREATE POLICY "Users can view own sessions"
  ON "Session" FOR SELECT
  TO authenticated
  USING ("userId" = (SELECT auth.uid()::text));

-- "VerificationToken": Sin políticas = acceso completamente bloqueado
-- cuando RLS está habilitado (comportamiento deseado para tokens temporales)


-- ══════════════════════════════════════════════════
-- 6. ÍNDICES PARA OPTIMIZAR LAS POLÍTICAS RLS
--    Siguiendo best practice: indexar columnas
--    usadas en políticas que no sean PK
-- ══════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_patient_doctor_id
  ON "Patient" (doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointment_doctor_id
  ON "Appointment" (doctor_id);

CREATE INDEX IF NOT EXISTS idx_therapy_session_patient_id
  ON "TherapySession" (patient_id);

CREATE INDEX IF NOT EXISTS idx_account_user_id
  ON "Account" ("userId");

CREATE INDEX IF NOT EXISTS idx_session_user_id
  ON "Session" ("userId");

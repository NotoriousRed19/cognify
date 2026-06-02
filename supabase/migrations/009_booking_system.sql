-- =================================================================================
-- Cognify — Migración 009: Sistema de Reservas Público (Booking)
-- =================================================================================

-- 1. Modificar tabla User
ALTER TABLE public."User" 
  ADD COLUMN IF NOT EXISTS "slug" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "booking_enabled" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "payment_instructions" TEXT;

-- 2. Crear tabla Availability (Horarios del doctor)
CREATE TABLE IF NOT EXISTS public."Availability" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "doctor_id" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
    "day_of_week" INTEGER NOT NULL CHECK ("day_of_week" BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que las políticas RLS se apliquen
ALTER TABLE public."Availability" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_select" ON public."Availability"
  FOR SELECT TO public
  USING (true); -- Cualquiera puede ver la disponibilidad (necesario para la página pública)

CREATE POLICY "availability_insert" ON public."Availability"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = doctor_id);

CREATE POLICY "availability_update" ON public."Availability"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = doctor_id)
  WITH CHECK (auth.uid()::text = doctor_id);

CREATE POLICY "availability_delete" ON public."Availability"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = doctor_id);

-- 3. Modificar tabla Appointment
-- Crear un tipo ENUM si no existe o usar TEXT constraint
-- Actualmente supabase en este proyecto usa TEXT, así que agregaremos las columnas y restringiremos luego si hace falta.
ALTER TABLE public."Appointment"
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'CONFIRMED' CHECK ("status" IN ('PENDING_APPROVAL', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'COMPLETADA')),
  ADD COLUMN IF NOT EXISTS "guest_name" TEXT,
  ADD COLUMN IF NOT EXISTS "guest_contact" TEXT,
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'MANUAL' CHECK ("source" IN ('MANUAL', 'PUBLIC'));

-- Ajustar las políticas de Appointment para permitir inserción a "anon" o autenticados públicos (si no lo está)
-- Para que el paciente pueda reservar sin login, debemos crear una política de INSERT para anon/authenticated general, 
-- pero SOLO si "source" = 'PUBLIC' y "status" = 'PENDING_APPROVAL'

CREATE POLICY "appointment_public_insert" ON public."Appointment"
  FOR INSERT TO public
  WITH CHECK ("source" = 'PUBLIC' AND "status" = 'PENDING_APPROVAL');

-- Nota: La lectura de Appointment (select) ya está protegida por doctor_id en 005_clean_rls.sql, 
-- el motor público de slots usará la llave de servicio de Supabase (service_role_key) para consultar todas las citas sin RLS, 
-- así protegemos la privacidad de las citas frente a usuarios públicos.

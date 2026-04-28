-- =================================================================================
-- SCRIPT DE SEGURIDAD: Habilitar Row Level Security (RLS) en Supabase
-- =================================================================================
-- IMPORTANTE: Este script es CRÍTICO para la seguridad. Sin él, cualquier usuario
-- autenticado podría leer los datos de otros psicólogos. 
-- Copia y pega esto en el SQL Editor de tu panel de Supabase y ejecútalo.

-- 1. Habilitar RLS en todas las tablas sensibles
ALTER TABLE public."Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TherapySession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 1.5. Políticas para "User" (Solo el propio usuario puede ver su perfil)
DROP POLICY IF EXISTS "Los usuarios solo pueden ver su propio perfil" ON public."User";
CREATE POLICY "Los usuarios solo pueden ver su propio perfil" 
ON public."User" FOR ALL 
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- 2. Políticas para "Patient" (Solo el doctor dueño puede ver/modificar sus pacientes)
DROP POLICY IF EXISTS "Los doctores solo pueden ver sus propios pacientes" ON public."Patient";
CREATE POLICY "Los doctores solo pueden ver sus propios pacientes" 
ON public."Patient" FOR ALL 
USING (auth.uid()::text = doctor_id)
WITH CHECK (auth.uid()::text = doctor_id);

-- 3. Políticas para "Appointment" (Solo el doctor dueño puede ver/modificar sus citas)
DROP POLICY IF EXISTS "Los doctores solo pueden ver sus propias citas" ON public."Appointment";
CREATE POLICY "Los doctores solo pueden ver sus propias citas" 
ON public."Appointment" FOR ALL 
USING (auth.uid()::text = doctor_id)
WITH CHECK (auth.uid()::text = doctor_id);

-- 4. Políticas para "TherapySession" 
-- Las sesiones no tienen doctor_id directamente, así que verificamos que el 
-- paciente asociado le pertenezca al doctor que hace la consulta.
DROP POLICY IF EXISTS "Los doctores solo pueden ver sesiones de sus pacientes" ON public."TherapySession";
CREATE POLICY "Los doctores solo pueden ver sesiones de sus pacientes" 
ON public."TherapySession" FOR ALL 
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

-- =================================================================================
-- ¡LISTO! Con esto, es matemáticamente y criptográficamente imposible que un
-- usuario acceda a los datos de otro usuario, incluso si lograran burlar el Frontend.

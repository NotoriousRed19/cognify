-- =================================================================================
-- Cognify — Migración 013: Hardening Anon Privileges (Defense-in-Depth)
-- =================================================================================
-- El rol `anon` tiene privilegios excesivos heredados de la configuración inicial.
-- RLS protege a nivel de fila, pero la defensa en profundidad exige restringir
-- también los privilegios a nivel de tabla.

-- 1. Revocar todo acceso anon a tablas sensibles
REVOKE ALL ON public."User" FROM anon;
REVOKE ALL ON public."Patient" FROM anon;
REVOKE ALL ON public."Account" FROM anon;
REVOKE ALL ON public."Session" FROM anon;
REVOKE ALL ON public."Subscription" FROM anon;
REVOKE ALL ON public."TherapySession" FROM anon;
REVOKE ALL ON public."VerificationToken" FROM anon;

-- 2. Restringir tablas del booking engine a solo lo necesario
-- Las RPCs SECURITY DEFINER ya operan como postgres, no necesitan SELECT de anon
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public."Appointment" FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public."Availability" FROM anon;

-- 3. Mantener SELECT en User solo para la búsqueda pública de doctores
-- (la ruta /api/doctors/search usa anon key y necesita SELECT sobre User)
GRANT SELECT ON public."User" TO anon;

-- 4. Limpiar índice redundante
DROP INDEX IF EXISTS idx_appointment_doctor_id;

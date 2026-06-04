-- =================================================================================
-- Cognify — Migración 018: Security Hardening (Defense-in-Depth)
-- =================================================================================

-- Revoke permissions from anon to prevent unauthorized active status toggling
-- La tabla p_activo tenía todos los privilegios habilitados para el rol anon por defecto.
-- Aunque RLS lo bloquea mediante "default deny", aplicamos el principio de defense-in-depth
-- revocando el acceso directo del rol anónimo a la tabla.
REVOKE ALL ON public.p_activo FROM anon;

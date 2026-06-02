-- =================================================================================
-- Cognify — Migración 014: Permitir SELECT público a Doctores
-- =================================================================================
-- RLS estaba bloqueando el acceso de lectura al rol anon en la tabla User,
-- lo que resultaba en 0 resultados en la búsqueda del directorio de reservas.

-- Agregar política para que cualquier persona (anon o autenticado) pueda ver
-- los perfiles de los doctores que tienen activado su directorio (booking_enabled = true)

CREATE POLICY "public_doctors_select" ON public."User"
  FOR SELECT 
  TO anon, authenticated
  USING (booking_enabled = true);

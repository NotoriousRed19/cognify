-- =================================================================================
-- Cognify — Migración 017: Optimización del Sistema de Notificaciones
-- =================================================================================

-- 1. Índice para búsquedas por status (útil para reintentos y reportes)
CREATE INDEX IF NOT EXISTS idx_notification_status ON public."Notification"(status);

-- 2. Índice compuesto para el CRON de recordatorios (evita escaneo completo)
CREATE INDEX IF NOT EXISTS idx_notification_event_status 
  ON public."Notification"(appointment_id, event_type, status);

-- 3. Columna para guardar detalles del error cuando falla un envío
ALTER TABLE public."Notification" 
  ADD COLUMN IF NOT EXISTS error_details TEXT;

-- 4. FIX: Hardening de privilegios anon en tablas creadas DESPUÉS de migración 013
-- Las tablas Notification y NotificationPreference heredaron grants por defecto para anon.
-- RLS protege, pero aplicamos defense-in-depth revocando acceso directo.
REVOKE ALL ON public."Notification" FROM anon;
REVOKE ALL ON public."NotificationPreference" FROM anon;

-- 5. FIX: Corregir grants de rpc_approve_appointment
-- La migración 015 recreó la función con firma (text, text), pero el REVOKE de 011
-- solo apuntaba a la firma vieja (uuid, text). Resultado: anon puede ejecutar.
-- El riesgo real es bajo (la función valida auth.uid() internamente), pero violaba
-- el principio de defense-in-depth.
REVOKE EXECUTE ON FUNCTION public.rpc_approve_appointment(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_approve_appointment(text, text) TO authenticated;

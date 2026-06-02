-- =================================================================================
-- Cognify — Migración 012: Booking Engine Optimizations & Public Access Fix
-- =================================================================================

-- 1. Restaurar el acceso público (anon) a las funciones RPC de reserva
-- El frontend (rutas /api/booking) utiliza el anon key por defecto.
GRANT EXECUTE ON FUNCTION public.rpc_get_doctor_slots_info(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, public;
GRANT EXECUTE ON FUNCTION public.rpc_request_appointment(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, JSONB) TO anon, public;

-- 2. Índice compuesto para optimización de colisiones y rangos de fechas
CREATE INDEX IF NOT EXISTS idx_appointment_doctor_dates 
ON public."Appointment" (doctor_id, fecha_inicio, fecha_fin);

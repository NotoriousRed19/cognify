-- =================================================================================
-- Cognify — Migración 007: Índices faltantes para rendimiento
-- =================================================================================
-- Estas columnas se usan frecuentemente en filtros y ORDER BY pero carecen
-- de índices, causando seq scans en producción.
-- =================================================================================

-- Appointment.fecha_inicio — usado en rangos de fecha en dashboard y calendario
CREATE INDEX IF NOT EXISTS idx_appointment_fecha_inicio
  ON public."Appointment" (fecha_inicio);

-- Appointment.estado — usado en filtro estado = 'COMPLETADA'
CREATE INDEX IF NOT EXISTS idx_appointment_estado
  ON public."Appointment" (estado);

-- Appointment.patient_id — foreign key sin índice
CREATE INDEX IF NOT EXISTS idx_appointment_patient_id
  ON public."Appointment" (patient_id);

-- TherapySession.fecha_sesion — usado en ORDER BY en la página de notas
CREATE INDEX IF NOT EXISTS idx_therapy_session_fecha_sesion
  ON public."TherapySession" (fecha_sesion);

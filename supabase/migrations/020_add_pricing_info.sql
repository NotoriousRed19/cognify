-- =================================================================================
-- Cognify — Migración 020: Añadir pricing_info a User
-- =================================================================================
-- Se añade una columna JSONB a la tabla User para almacenar los precios de los servicios
-- y la tasa de cambio configurada por el doctor.

ALTER TABLE public."User"
ADD COLUMN IF NOT EXISTS pricing_info JSONB DEFAULT '{}'::jsonb;

-- Comentario para la columna
COMMENT ON COLUMN public."User".pricing_info IS 'Guarda la configuración de servicios y precios del doctor. Ejemplo: {"service1": "Terapia 25$", "service2": "Terapia parejas 45$", "service3": "1 Hora 15$", "exchangeRate": "$ = 650 bs"}';

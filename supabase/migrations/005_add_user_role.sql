-- ═══════════════════════════════════════════════════════════════════════════════
-- Cognify — Migración: Agregar columna "role" a la tabla "User"
-- ═══════════════════════════════════════════════════════════════════════════════
-- Esta migración agrega la columna de roles al perfil del usuario y asegura
-- que el trigger de creación copie el rol (por defecto 'Usuario').
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Agregar columna de rol si no existe
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Usuario';

-- 2. Actualizar la función handle_new_user() para sincronizar el rol
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO "User" (id, email, name, role)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Usuario')
  );
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Cognify — Fix: Auth Trigger "Database error saving new user"
-- ═══════════════════════════════════════════════════════════════════════════════
-- PROBLEMA: El trigger handle_new_user() falla porque:
--   1. `set search_path = ''` hace que no encuentre public."User"
--   2. La tabla "User" tiene RLS habilitado con FOR ALL, lo que bloquea
--      el INSERT del trigger incluso con SECURITY DEFINER
--
-- SOLUCIÓN: Recrear la función con search_path correcto y asegurar que
-- el rol del trigger pueda hacer bypass de RLS.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Recrear la función con search_path = public (para que encuentre la tabla)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = 'public'
as $$
begin
  insert into "User" (id, email, name)
  values (
    new.id::text,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- 2. Asegurar que el trigger sigue enlazado (por si acaso)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. CRÍTICO: Permitir que el service_role (que ejecuta SECURITY DEFINER triggers)
-- pueda hacer bypass de RLS en la tabla "User" para el INSERT del trigger.
-- Sin esto, el INSERT falla porque la política FOR ALL requiere auth.uid() = id,
-- pero auth.uid() no está disponible durante el trigger de creación.
ALTER TABLE public."User" FORCE ROW LEVEL SECURITY;

-- 4. Agregar una política específica que permita al trigger insertar nuevos usuarios
-- El SECURITY DEFINER ejecuta como el owner de la función (normalmente postgres/supabase_admin)
-- pero si RLS está habilitado con FORCE, necesitamos una política para el service_role
DROP POLICY IF EXISTS "Service role can manage all users" ON public."User";
CREATE POLICY "Service role can manage all users"
ON public."User" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Alternativa más simple: si la política "FOR ALL" es demasiado restrictiva,
-- podemos reemplazarla con políticas separadas por operación
DROP POLICY IF EXISTS "Los usuarios solo pueden ver su propio perfil" ON public."User";

-- SELECT: usuarios autenticados solo ven su perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
DROP POLICY IF EXISTS "Users can view their own profile" ON public."User";
CREATE POLICY "Users can view own profile"
ON public."User" FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

-- INSERT: permitir al trigger insertar (via service_role / security definer)
DROP POLICY IF EXISTS "Allow trigger to insert new users" ON public."User";
CREATE POLICY "Allow trigger to insert new users"
ON public."User" FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- UPDATE: usuarios solo pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
CREATE POLICY "Users can update own profile"
ON public."User" FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- DELETE: usuarios solo pueden eliminar su propio perfil
DROP POLICY IF EXISTS "Users can delete own profile" ON public."User";
CREATE POLICY "Users can delete own profile"
ON public."User" FOR DELETE
TO authenticated
USING (auth.uid()::text = id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Cognify — Sincronización de Usuarios (Supabase Auth -> Public Schema)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Ejecutar este script en el SQL Editor del Dashboard de Supabase.
-- 
-- Este trigger asegura que cuando un usuario se registra a través de Supabase Auth
-- (esquema `auth.users`), se cree automáticamente un registro correspondiente
-- en nuestra tabla pública `"User"`.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Crear la función que inserta el usuario en el esquema público
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = 'public'
as $$
begin
  insert into public."User" (id, email, name)
  values (
    new.id::text,
    new.email,
    -- Extraer el nombre de los metadatos si está disponible (útil para OAuth o si lo pasas en el signUp)
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- 2. Crear el trigger que llama a la función cuando se inserta en auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- NOTA: Como cambiamos de Prisma a Supabase Auth nativo, los IDs generados 
-- serán UUIDs nativos de Supabase. La tabla "User" de Prisma fue creada 
-- con IDs de tipo String (cuid). Supabase Auth insertará UUIDs como strings,
-- lo cual es compatible con la definición actual de la base de datos.

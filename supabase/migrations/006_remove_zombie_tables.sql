-- =================================================================================
-- Cognify — Migración 006: Eliminar tablas zombie de NextAuth
-- =================================================================================
-- Las tablas Account, Session y VerificationToken son remanentes de una
-- migración anterior desde Prisma/NextAuth. La app ahora usa Supabase Auth
-- nativo y estas tablas están permanentemente vacías.
-- Eliminarlas reduce la superficie de ataque y limpia el esquema.
-- =================================================================================

-- Eliminar índices de tablas zombie primero
DROP INDEX IF EXISTS public.idx_account_user_id;
DROP INDEX IF EXISTS public.idx_session_user_id;

-- Eliminar tablas zombie (CASCADE elimina políticas RLS y constraints)
DROP TABLE IF EXISTS public."Account" CASCADE;
DROP TABLE IF EXISTS public."Session" CASCADE;
DROP TABLE IF EXISTS public."VerificationToken" CASCADE;

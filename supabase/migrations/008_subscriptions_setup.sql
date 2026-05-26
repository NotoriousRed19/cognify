-- =================================================================================
-- Cognify — Migración 008: Setup de Suscripciones y Panel Admin
-- =================================================================================

-- 1. Crear tipo ENUM para el estado del plan
CREATE TYPE plan_status_type AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED');

-- 2. Crear tabla Subscription
CREATE TABLE IF NOT EXISTS public."Subscription" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
    "plan_status" plan_status_type NOT NULL DEFAULT 'TRIAL',
    "trial_ends_at" TIMESTAMP WITH TIME ZONE,
    "last_payment_date" TIMESTAMP WITH TIME ZONE,
    "next_billing_date" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id")
);

-- 3. Habilitar RLS en Subscription
ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Un usuario solo puede ver su propia suscripción
CREATE POLICY "Users can view own subscription"
    ON public."Subscription" FOR SELECT
    TO authenticated
    USING ("user_id" = (SELECT auth.uid()::text));

-- El administrador o el backend con Service Role Key puede hacer el resto (bypassea RLS).

-- 5. Llenar suscripciones para usuarios existentes (14 días de TRIAL retroactivos)
INSERT INTO public."Subscription" ("user_id", "plan_status", "trial_ends_at", "next_billing_date")
SELECT 
    id, 
    'TRIAL'::plan_status_type, 
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days'
FROM public."User"
ON CONFLICT ("user_id") DO NOTHING;

-- 6. Actualizar la función del trigger para que cree una Subscription al registrarse un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    -- Insertar en User
    INSERT INTO public."User" (id, email, name)
    VALUES (
        new.id::text,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
    );
    
    -- Insertar en Subscription (14 días de Trial)
    INSERT INTO public."Subscription" ("user_id", "plan_status", "trial_ends_at", "next_billing_date")
    VALUES (
        new.id::text,
        'TRIAL',
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '14 days'
    );

    RETURN new;
END;
$$;

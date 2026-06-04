-- supabase/migrations/016_notification_system.sql

-- Tabla de Notificaciones (log/auditoría)
CREATE TABLE public."Notification" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id TEXT REFERENCES public."User"(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES public."Appointment"(id) ON DELETE SET NULL,
    channel TEXT DEFAULT 'EMAIL',
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('DOCTOR', 'PATIENT')),
    recipient_contact TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'PENDING')),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Preferencias de Notificación del Doctor
CREATE TABLE public."NotificationPreference" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id TEXT UNIQUE REFERENCES public."User"(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    reminder_24h BOOLEAN DEFAULT true,
    custom_reminder_message TEXT,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_notification_doctor ON public."Notification"(doctor_id);
CREATE INDEX idx_notification_appointment ON public."Notification"(appointment_id);
CREATE INDEX idx_notification_created ON public."Notification"("createdAt");

-- Habilitar Row Level Security (RLS)
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NotificationPreference" ENABLE ROW LEVEL SECURITY;

-- Políticas para Notification (El doctor solo puede ver las notificaciones de su cuenta)
CREATE POLICY "notification_read" ON public."Notification"
    FOR SELECT TO authenticated
    USING (doctor_id = (SELECT auth.uid()::text));

-- Políticas para NotificationPreference (El doctor puede ver y actualizar sus preferencias)
CREATE POLICY "preference_read" ON public."NotificationPreference"
    FOR SELECT TO authenticated
    USING (doctor_id = (SELECT auth.uid()::text));

CREATE POLICY "preference_insert" ON public."NotificationPreference"
    FOR INSERT TO authenticated
    WITH CHECK (doctor_id = (SELECT auth.uid()::text));

CREATE POLICY "preference_update" ON public."NotificationPreference"
    FOR UPDATE TO authenticated
    USING (doctor_id = (SELECT auth.uid()::text))
    WITH CHECK (doctor_id = (SELECT auth.uid()::text));

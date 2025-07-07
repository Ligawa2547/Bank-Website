-- ====================================================================
--  Admin Notifications table + supporting objects
--  Run this script once in Supabase SQL Editor (or via v0 “Run Script”)
-- ====================================================================

BEGIN;

-----------------------------------------------------------------------
-- 1) Table definition
-----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT            NOT NULL,
    message     TEXT            NOT NULL,
    type        TEXT            NOT NULL DEFAULT 'info' 
                    CHECK (type IN ('info','success','warning','error')),
    read        BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
    ON public.admin_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read
    ON public.admin_notifications (read);

-----------------------------------------------------------------------
-- 2) Update-timestamp trigger (only if the helper doesn’t exist yet)
-----------------------------------------------------------------------
-- Utility function
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END
$$;

-- Trigger on the admin_notifications table
CREATE TRIGGER trg_admin_notifications_set_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-----------------------------------------------------------------------
-- 3) Row-Level-Security: only admins (@iaenb.com) may access
-----------------------------------------------------------------------
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow select / insert / update / delete for admin users only
CREATE POLICY "Admins have full access to admin_notifications"
ON public.admin_notifications
    FOR ALL
    USING (auth.jwt() ->> 'email' LIKE '%@iaenb.com')
    WITH CHECK (auth.jwt() ->> 'email' LIKE '%@iaenb.com');

COMMIT;

------------------------------------------------------------------
--  FIX USERS TABLE PRIVILEGES for SUPABASE authenticated ROLE
------------------------------------------------------------------
-- ⚠️  Run this as the database owner or with a service-role key.
--     It grants the *authenticated* Postgres role the minimum
--     privileges required for the dashboard to read & update the
--     current user’s row.  Row-Level-Security (RLS) continues to
--     restrict each user to his/her own data.

-- 1.  Make sure the schema itself is accessible.
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2.  Allow reads and updates on the table.  (INSERT is optional,
--     DELETE intentionally omitted.)
GRANT SELECT, UPDATE ON TABLE public.users TO authenticated;

-- 3.  If you added new columns later, authenticated still needs
--     permission; this default takes care of that.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres         -- owner role
IN SCHEMA public
GRANT SELECT, UPDATE ON TABLES TO authenticated;

-- 4.  Finally, confirm that RLS is turned on (needed for Supabase).
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2025-07-11  |  Fix basic privileges + RLS policy on public.users
-- --------------------------------------------------------------------
-- RUN THIS ONCE as the database owner or with your Supabase SERVICE role.
-- It gives the built-in `authenticated` role the minimum rights needed
-- for the dashboard (and other client queries) while keeping data safe
-- via Row-Level-Security (RLS).

-----------------------------
-- 1)  Schema level access  -
-----------------------------
GRANT USAGE ON SCHEMA public TO authenticated;

----------------------------------------------------
-- 2)  Table privileges (SELECT + UPDATE only)    -
--     INSERT is handled by the signup trigger,   -
--     and DELETE is intentionally *not* granted. -
----------------------------------------------------
GRANT SELECT, UPDATE ON TABLE public.users TO authenticated;

----------------------------------------------------------
-- 3)  Future-proof: whenever new columns are added,    --
--     keep the same SELECT/UPDATE privileges in place. --
----------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres           -- 👈 replace with owner
IN SCHEMA public
GRANT SELECT, UPDATE ON TABLES TO authenticated;

-------------------------------------------
-- 4)  Ensure Row-Level-Security is ON    -
-------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-------------------------------------------------
-- 5)  Create / replace the RLS SELECT policy  -
--     so each user can only see *their* row.  -
-------------------------------------------------
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT USING (
  auth.uid() = id           -- 🔒 allow user to read only where id = auth.uid()
);

--------------------------------------------------------------
-- 6)  (Optional) UPDATE policy, if you want profile editing --
--------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE USING (
  auth.uid() = id
);

-- ✅  Done: the `authenticated` role can now read & update its own row,
--     and nothing else.  Your dashboard pages will stop throwing the
--     "permission denied for table users" error.

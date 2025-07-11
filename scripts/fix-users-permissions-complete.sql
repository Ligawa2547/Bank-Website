-- Fix permissions for users table to allow authenticated users to read their own data

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select and update permissions on users table
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.generate_account_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_account_no ON public.users(account_no);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

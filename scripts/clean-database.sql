-- Clean up existing data and start fresh
-- WARNING: This will delete all user data

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.generate_account_number();
DROP FUNCTION IF EXISTS public.update_user_metadata(uuid, text, text, text, text, text);

-- Clear existing user data (optional - uncomment if you want to start completely fresh)
-- DELETE FROM public.notifications;
-- DELETE FROM public.transactions;
-- DELETE FROM public.user_profiles;
-- DELETE FROM public.users;

-- Reset sequences if they exist
-- ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- Create a simple users table structure for fresh start
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone_number text,
  city text,
  country text,
  account_no text UNIQUE,
  account_balance numeric DEFAULT 0,
  status text DEFAULT 'active',
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  kyc_status text DEFAULT 'not_submitted',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admin can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@iaenb.com'
    )
  );

COMMENT ON TABLE public.users IS 'Fresh start - users table rebuilt from scratch';

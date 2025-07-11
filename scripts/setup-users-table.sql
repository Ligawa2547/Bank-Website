-- Drop existing tables and functions to start fresh
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.generate_account_number() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    city TEXT,
    country TEXT,
    account_no TEXT UNIQUE NOT NULL,
    account_balance DECIMAL(15,2) DEFAULT 0.00,
    profile_pic TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'closed')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
    kyc_id_type TEXT,
    kyc_id_number TEXT,
    kyc_id_expiry DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to generate account numbers starting with 100
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_account_no TEXT;
    counter INTEGER;
BEGIN
    -- Get the current count of users and add 1
    SELECT COUNT(*) + 1 INTO counter FROM public.users;
    
    -- Generate account number starting with 100
    new_account_no := '100' || LPAD(counter::TEXT, 7, '0');
    
    -- Check if account number already exists (just in case)
    WHILE EXISTS (SELECT 1 FROM public.users WHERE account_no = new_account_no) LOOP
        counter := counter + 1;
        new_account_no := '100' || LPAD(counter::TEXT, 7, '0');
    END LOOP;
    
    RETURN new_account_no;
END;
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_account_no TEXT;
BEGIN
    -- Generate account number
    new_account_no := public.generate_account_number();
    
    -- Insert user data
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        phone_number,
        city,
        country,
        account_no,
        account_balance,
        status,
        email_verified,
        phone_verified,
        kyc_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'city', ''),
        COALESCE(NEW.raw_user_meta_data->>'country', ''),
        new_account_no,
        0.00,
        'active',
        NEW.email_confirmed_at IS NOT NULL,
        false,
        'not_submitted',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create user record when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Grant permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_account_number() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_account_no ON public.users(account_no);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

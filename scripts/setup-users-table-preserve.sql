-- Preserve existing users - only add missing columns and functions

-- First, let's check if the users table exists and add missing columns
DO $$ 
BEGIN
    -- Add account_no column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_no') THEN
        ALTER TABLE public.users ADD COLUMN account_no TEXT UNIQUE;
    END IF;
    
    -- Add other missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_balance') THEN
        ALTER TABLE public.users ADD COLUMN account_balance DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE public.users ADD COLUMN kyc_status TEXT DEFAULT 'not_submitted';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_id_type') THEN
        ALTER TABLE public.users ADD COLUMN kyc_id_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_id_number') THEN
        ALTER TABLE public.users ADD COLUMN kyc_id_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_id_expiry') THEN
        ALTER TABLE public.users ADD COLUMN kyc_id_expiry DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_pic') THEN
        ALTER TABLE public.users ADD COLUMN profile_pic TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE public.users ADD COLUMN first_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE public.users ADD COLUMN last_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') THEN
        ALTER TABLE public.users ADD COLUMN phone_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
        ALTER TABLE public.users ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE public.users ADD COLUMN country TEXT;
    END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
    -- Add status check constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'users_status_check') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'pending', 'suspended', 'closed'));
    END IF;
    
    -- Add kyc_status check constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'users_kyc_status_check') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_kyc_status_check CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraints already exist, continue
        NULL;
END $$;

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

-- Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop first to avoid conflicts)
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

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_account_no ON public.users(account_no);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Generate account numbers for existing users who don't have them
UPDATE public.users 
SET account_no = public.generate_account_number()
WHERE account_no IS NULL OR account_no = '';

-- Set default values for existing users
UPDATE public.users 
SET 
    account_balance = COALESCE(account_balance, 0.00),
    status = COALESCE(status, 'active'),
    email_verified = COALESCE(email_verified, false),
    phone_verified = COALESCE(phone_verified, false),
    kyc_status = COALESCE(kyc_status, 'not_submitted')
WHERE account_balance IS NULL 
   OR status IS NULL 
   OR email_verified IS NULL 
   OR phone_verified IS NULL 
   OR kyc_status IS NULL;

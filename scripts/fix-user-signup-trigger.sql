-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.generate_account_number();

-- Create function to generate unique account numbers
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT AS $$
DECLARE
    new_account_no TEXT;
    account_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 10-digit account number starting with 10 (bank code)
        new_account_no := '10' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
        
        -- Check if account number already exists
        SELECT EXISTS(SELECT 1 FROM public.users WHERE account_no = new_account_no) INTO account_exists;
        
        -- If account number doesn't exist, break the loop
        IF NOT account_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_account_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_account_no TEXT;
BEGIN
    -- Generate unique account number
    new_account_no := public.generate_account_number();

    -- Insert into public.users table
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
        COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'city', ''),
        COALESCE(NEW.raw_user_meta_data->>'country', ''),
        new_account_no,
        0.00,
        'active',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        COALESCE(NEW.phone_confirmed_at IS NOT NULL, false),
        'not_submitted',
        NOW(),
        NOW()
    );

    -- Also insert into user_profiles for backward compatibility
    INSERT INTO public.user_profiles (
        user_id,
        first_name,
        last_name,
        email,
        phone_number,
        city,
        country,
        account_number,
        balance,
        email_verified,
        phone_verified,
        kyc_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'city', ''),
        COALESCE(NEW.raw_user_meta_data->>'country', ''),
        new_account_no,
        0.00,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        COALESCE(NEW.phone_confirmed_at IS NOT NULL, false),
        'not_submitted',
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_account_number() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

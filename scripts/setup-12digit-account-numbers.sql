-- Create function to generate unique 12-digit account numbers
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_account_no TEXT;
    timestamp_part TEXT;
    counter_part TEXT;
    random_part TEXT;
    counter INTEGER;
BEGIN
    -- Get current timestamp (last 6 digits of unix timestamp)
    timestamp_part := RIGHT(EXTRACT(EPOCH FROM NOW())::TEXT, 6);
    
    -- Get counter based on existing users count
    SELECT COUNT(*) + 1 INTO counter FROM public.users;
    counter_part := LPAD(counter::TEXT, 3, '0');
    
    -- Generate random 3-digit number
    random_part := LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
    -- Combine to create 12-digit account number
    new_account_no := timestamp_part || counter_part || random_part;
    
    -- Ensure it's exactly 12 digits
    new_account_no := LPAD(new_account_no, 12, '0');
    
    -- Check if account number already exists (collision detection)
    WHILE EXISTS (SELECT 1 FROM public.users WHERE account_no = new_account_no) LOOP
        -- Increment random part and try again
        random_part := LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
        new_account_no := timestamp_part || counter_part || random_part;
        new_account_no := LPAD(new_account_no, 12, '0');
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
    -- Generate unique 12-digit account number
    new_account_no := public.generate_account_number();
    
    -- Insert user data into public.users table
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_account_number() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;

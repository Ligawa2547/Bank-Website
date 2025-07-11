-- Drop any old version that might have bad SQL inside
DROP FUNCTION IF EXISTS public.update_user_metadata(
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_city text,
  p_country text
);

CREATE OR REPLACE FUNCTION public.update_user_metadata(
  p_user_id     uuid,
  p_first_name  text,
  p_last_name   text,
  p_phone       text,
  p_city        text,
  p_country     text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_account_no TEXT;
BEGIN
  -- Check if user exists in public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    -- Generate account number for new user
    new_account_no := public.generate_account_number();
    
    -- Insert new user record
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
        p_user_id,
        (SELECT email FROM auth.users WHERE id = p_user_id),
        p_first_name,
        p_last_name,
        p_phone,
        p_city,
        p_country,
        new_account_no,
        0.00,
        'active',
        false,
        false,
        'not_submitted',
        NOW(),
        NOW()
    );
    
    -- Also insert into user_profiles
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
        p_user_id,
        p_first_name,
        p_last_name,
        (SELECT email FROM auth.users WHERE id = p_user_id),
        p_phone,
        p_city,
        p_country,
        new_account_no,
        0.00,
        false,
        false,
        'not_submitted',
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO NOTHING;
  ELSE
    -- Update existing user
    UPDATE public.users AS u
       SET first_name    = p_first_name,
           last_name     = p_last_name,
           phone_number  = p_phone,
           city          = p_city,
           country       = p_country,
           updated_at    = NOW()
     WHERE u.id = p_user_id;

    -- Update user_profiles (legacy / compatibility)
    UPDATE public.user_profiles AS up
       SET first_name    = p_first_name,
           last_name     = p_last_name,
           phone_number  = p_phone,
           city          = p_city,
           country       = p_country,
           updated_at    = NOW()
     WHERE up.user_id = p_user_id;
  END IF;
END;
$$;

-- Make sure your API roles can execute it
GRANT EXECUTE ON FUNCTION public.update_user_metadata(
  uuid, text, text, text, text, text
) TO anon, authenticated, service_role;

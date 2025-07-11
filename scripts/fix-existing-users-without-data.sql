-- Fix existing users who signed up but don't have data in public.users table
DO $$
DECLARE
    auth_user RECORD;
    new_account_no TEXT;
BEGIN
    -- Loop through auth.users who don't have corresponding records in public.users
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.phone, au.email_confirmed_at, au.phone_confirmed_at, au.created_at
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        -- Generate account number for this user
        LOOP
            new_account_no := '10' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
            
            -- Check if account number already exists
            IF NOT EXISTS (SELECT 1 FROM public.users WHERE account_no = new_account_no) THEN
                EXIT;
            END IF;
        END LOOP;
        
        -- Insert into public.users
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
            auth_user.id,
            auth_user.email,
            COALESCE(auth_user.raw_user_meta_data->>'first_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'phone_number', auth_user.phone, ''),
            COALESCE(auth_user.raw_user_meta_data->>'city', ''),
            COALESCE(auth_user.raw_user_meta_data->>'country', ''),
            new_account_no,
            0.00,
            'active',
            COALESCE(auth_user.email_confirmed_at IS NOT NULL, false),
            COALESCE(auth_user.phone_confirmed_at IS NOT NULL, false),
            'not_submitted',
            COALESCE(auth_user.created_at, NOW()),
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
            auth_user.id,
            COALESCE(auth_user.raw_user_meta_data->>'first_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
            auth_user.email,
            COALESCE(auth_user.raw_user_meta_data->>'phone_number', auth_user.phone, ''),
            COALESCE(auth_user.raw_user_meta_data->>'city', ''),
            COALESCE(auth_user.raw_user_meta_data->>'country', ''),
            new_account_no,
            0.00,
            COALESCE(auth_user.email_confirmed_at IS NOT NULL, false),
            COALESCE(auth_user.phone_confirmed_at IS NOT NULL, false),
            'not_submitted',
            COALESCE(auth_user.created_at, NOW()),
            NOW()
        ) ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Fixed user: % with account number: %', auth_user.email, new_account_no;
    END LOOP;
END $$;

-- Create function to update user metadata during signup
CREATE OR REPLACE FUNCTION public.update_user_metadata(
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    city TEXT,
    country TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Update the users table with the provided information
    UPDATE public.users 
    SET 
        first_name = COALESCE(update_user_metadata.first_name, users.first_name),
        last_name = COALESCE(update_user_metadata.last_name, users.last_name),
        phone_number = COALESCE(update_user_metadata.phone_number, users.phone_number),
        city = COALESCE(update_user_metadata.city, users.city),
        country = COALESCE(update_user_metadata.country, users.country),
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Also update user_profiles for backward compatibility
    UPDATE public.user_profiles 
    SET 
        first_name = COALESCE(update_user_metadata.first_name, user_profiles.first_name),
        last_name = COALESCE(update_user_metadata.last_name, user_profiles.last_name),
        phone_number = COALESCE(update_user_metadata.phone_number, user_profiles.phone_number),
        city = COALESCE(update_user_metadata.city, user_profiles.city),
        country = COALESCE(update_user_metadata.country, user_profiles.country),
        updated_at = NOW()
    WHERE user_id = update_user_metadata.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_metadata(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;

-- Verify that users are being created properly
SELECT 
    'Auth Users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Public Users' as table_name,
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
    'User Profiles' as table_name,
    COUNT(*) as count
FROM public.user_profiles;

-- Check for users in auth.users but not in public.users
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    pu.id IS NOT NULL as has_public_record,
    pu.account_no,
    pu.first_name,
    pu.last_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;

-- Check recent signups
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    u.account_no,
    u.status,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 5;

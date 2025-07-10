-- Debug script to check users table structure and data
-- Run this in Supabase SQL Editor to diagnose user data issues

-- Check if users table exists
SELECT 
    table_name, 
    table_schema
FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- Check users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count total users
SELECT COUNT(*) as total_users FROM public.users;

-- Sample user data (first 5 users)
SELECT 
    id,
    email,
    first_name,
    last_name,
    account_no,
    account_balance,
    status,
    kyc_status,
    created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check for users with missing data
SELECT 
    COUNT(*) as users_without_account_no
FROM public.users 
WHERE account_no IS NULL OR account_no = '';

SELECT 
    COUNT(*) as users_without_names
FROM public.users 
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '';

-- Check RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Check if there are any auth.users without corresponding public.users
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    pu.id as public_user_id,
    pu.created_at as public_created
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

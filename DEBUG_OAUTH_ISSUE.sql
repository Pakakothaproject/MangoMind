-- DEBUG GOOGLE OAUTH ISSUE
-- Run these queries one by one to diagnose the problem

-- 1. Check if the function was actually updated
SELECT 'FUNCTION DEFINITION:' as check_type;
SELECT pg_get_functiondef('public.handle_new_user'::regproc);

-- 2. Check if the trigger exists
SELECT 'TRIGGER EXISTS:' as check_type;
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check if user was created (replace with actual user ID from the access token)
-- The user ID from the JWT payload appears to be: 046cb51a-d7dc-4c6c-af11-cefb58357f87
SELECT 'USER PROFILE EXISTS:' as check_type;
SELECT
    p.id,
    p.username,
    p.updated_at as profile_updated,
    p.token_balance
FROM profiles p
WHERE p.id = '046cb51a-d7dc-4c6c-af11-cefb58357f87';

-- 4. Check if user exists in auth.users
SELECT 'USER IN AUTH.USERS:' as check_type;
SELECT
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
WHERE id = '046cb51a-d7dc-4c6c-af11-cefb58357f87';

-- 5. Check recent error logs (if available)
-- This might not work in Supabase, but let's try
SELECT 'RECENT LOGS:' as check_type;
-- Note: This might not be available in Supabase free tier

-- 6. Test the function manually with the user's data
SELECT 'FUNCTION TEST:' as check_type;
-- This simulates what happens when the user signs up
-- We'll test with the actual user data from the JWT

DO $$
DECLARE
    test_user_id UUID := '046cb51a-d7dc-4c6c-af11-cefb58357f87';
    test_email TEXT := 'laibibrashid999@gmail.com';
    test_meta_data JSONB := '{
        "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK3sMq0YjQurCW9zTWopfaAmiJkfmFdrabB7_Rq2AXev-uOh-A=s96-c",
        "email": "laibibrashid999@gmail.com",
        "email_verified": true,
        "full_name": "Labib Rashid",
        "iss": "https://accounts.google.com",
        "name": "Labib Rashid",
        "phone_verified": false,
        "picture": "https://lh3.googleusercontent.com/a/ACg8ocK3sMq0YjQurCW9zTWopfaAmiJkfmFdrabB7_Rq2AXev-uOh-A=s96-c",
        "provider_id": "109925433166593324189",
        "sub": "109925433166593324189"
    }';
    result_text TEXT;
BEGIN
    -- Test username generation logic
    result_text := COALESCE(
        test_meta_data->>'username',
        split_part(test_email, '@', 1),
        'user_' || substr(test_user_id::TEXT, 1, 8)
    );

    result_text := regexp_replace(result_text, '[^a-zA-Z0-9_]', '', 'g');
    result_text := substr(result_text, 1, 30);

    RAISE NOTICE 'Generated username would be: %', result_text;
    RAISE NOTICE 'Function test completed successfully';
END $$;

-- 7. Check if there are any constraint violations or RLS issues
SELECT 'CONSTRAINTS CHECK:' as check_type;
SELECT
    conname,
    conrelid::regclass,
    pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
    AND contype IN ('c', 'f', 'p', 'u');

-- 8. Check RLS policies
SELECT 'RLS POLICIES:' as check_type;
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'categories', 'personas');

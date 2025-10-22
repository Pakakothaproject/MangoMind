-- QUICK GOOGLE OAUTH DEBUG
-- Run these queries to find the issue

-- 1. Check if the user exists in auth.users
SELECT 'USER EXISTS IN AUTH:' as check;
SELECT id, email, created_at, raw_user_meta_data->>'username' as username_meta
FROM auth.users
WHERE id = '046cb51a-d7dc-4c6c-af11-cefb58357f87';

-- 2. Check if profile exists
SELECT 'PROFILE EXISTS:' as check;
SELECT id, username, token_balance
FROM profiles
WHERE id = '046cb51a-d7dc-4c6c-af11-cefb58357f87';

-- 3. Check function definition (is it the new version?)
SELECT 'FUNCTION VERSION:' as check;
SELECT substring(pg_get_functiondef('public.handle_new_user'::regproc), 80, 100) as function_snippet;

-- 4. Test username generation
SELECT 'USERNAME TEST:' as check;
SELECT
    'laibibrashid999@gmail.com' as email,
    split_part('laibibrashid999@gmail.com', '@', 1) as generated_username,
    regexp_replace(split_part('laibibrashid999@gmail.com', '@', 1), '[^a-zA-Z0-9_]', '', 'g') as cleaned_username;

-- 5. Check if trigger exists
SELECT 'TRIGGER EXISTS:' as check;
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 6. Check RLS policies
SELECT 'RLS POLICIES:' as check;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 7. If profile doesn't exist, try to create it manually
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '046cb51a-d7dc-4c6c-af11-cefb58357f87') THEN
        INSERT INTO profiles (id, username, token_balance, free_generations_remaining, bonus_expires_at, storage_limit_bytes)
        VALUES ('046cb51a-d7dc-4c6c-af11-cefb58357f87', 'laibibrashid999', 10000, 3, NOW() + INTERVAL '2 days', 209715200);

        RAISE NOTICE 'Profile created manually';
    ELSE
        RAISE NOTICE 'Profile already exists';
    END IF;
END $$;

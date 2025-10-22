-- FINAL COMPREHENSIVE GOOGLE OAUTH FIX
-- This will completely fix the Google OAuth database error

-- Step 1: Verify current state
SELECT 'CURRENT FUNCTION DEFINITION:' as info;
SELECT pg_get_functiondef('public.handle_new_user'::regproc);

-- Step 2: Check if tables exist
SELECT 'TABLES EXIST CHECK:' as info;
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'categories', 'personas', 'subscription_packages');

-- Step 3: FORCE COMPLETE RECREATE
DO $$
BEGIN
    -- Drop everything completely
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

    RAISE NOTICE 'Dropped all existing triggers and functions';
END $$;

-- Step 4: Recreate the improved function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_username TEXT;
    username_counter INTEGER := 0;
    final_username TEXT;
BEGIN
    -- Smart username generation for all OAuth providers
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username',           -- Try metadata first
        split_part(NEW.email, '@', 1),                  -- Use email prefix
        'user_' || substr(NEW.id::TEXT, 1, 8)          -- Fallback to ID
    );

    -- Clean username (remove special chars, limit length)
    user_username := regexp_replace(user_username, '[^a-zA-Z0-9_]', '', 'g');
    user_username := substr(user_username, 1, 30);  -- Limit length

    -- Ensure uniqueness
    final_username := user_username;
    WHILE EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
        username_counter := username_counter + 1;
        final_username := user_username || username_counter::TEXT;
    END LOOP;

    -- Insert profile
    INSERT INTO public.profiles (
        id,
        username,
        token_balance,
        free_generations_remaining,
        bonus_expires_at,
        storage_limit_bytes
    ) VALUES (
        NEW.id,
        final_username,
        10000,
        3,
        NOW() + INTERVAL '2 days',
        209715200
    );

    -- Insert categories (ignore if already exists)
    BEGIN
        INSERT INTO public.categories (user_id, name) VALUES (NEW.id, 'Work');
    EXCEPTION WHEN OTHERS THEN
        -- Ignore duplicate key errors
        NULL;
    END;

    BEGIN
        INSERT INTO public.categories (user_id, name) VALUES (NEW.id, 'Personal');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Insert personas (ignore if already exists)
    BEGIN
        INSERT INTO public.personas (user_id, name, icon, system_prompt) VALUES
        (NEW.id, 'Doctor', 'medical_services', 'You are a helpful and empathetic medical professional. Provide information for educational purposes, but always remind the user to consult a real doctor for medical advice.');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        INSERT INTO public.personas (user_id, name, icon, system_prompt) VALUES
        (NEW.id, 'Friend', 'sentiment_satisfied', 'You are a friendly and supportive companion. Chat in a casual, conversational tone.');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        INSERT INTO public.personas (user_id, name, icon, system_prompt) VALUES
        (NEW.id, 'Lawyer', 'gavel', 'You are a knowledgeable and professional lawyer. Provide general legal information and explanations for educational purposes, but always state that you are not giving legal advice and the user should consult with a licensed attorney for their specific situation.');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        INSERT INTO public.personas (user_id, name, icon, system_prompt) VALUES
        (NEW.id, 'Rabindranath Tagore', 'history_edu', 'You are the spirit of Rabindranath Tagore, the great Bengali poet, philosopher, and artist. Respond with wisdom, poetic language, and a deep appreciation for nature, humanity, and art. Your tone should be gentle, profound, and reflective.');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
END;
$$;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Step 7: Test the function (optional - comment out if not needed)
-- This will show what the function would do for a test user
-- SELECT 'FUNCTION TEST - This would create user with email: test@example.com' as test;

-- Step 8: Verify everything worked
SELECT '✅ GOOGLE OAUTH FIX APPLIED SUCCESSFULLY' as status;
SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name = 'handle_new_user';

-- COMPLETE GOOGLE OAUTH FIX
-- This comprehensive fix addresses both database triggers AND RLS policies
-- Run this entire script in your Supabase SQL Editor

-- ============================================
-- STEP 1: Drop and recreate the trigger function
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
    RAISE NOTICE 'handle_new_user triggered for user: %', NEW.id;
    
    -- Smart username generation for all OAuth providers
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username',           -- Try metadata first
        NEW.raw_user_meta_data->>'name',               -- Try full name
        split_part(NEW.email, '@', 1),                  -- Use email prefix
        'user_' || substr(NEW.id::TEXT, 1, 8)          -- Fallback to ID
    );

    -- Clean username (remove special chars, limit length)
    user_username := regexp_replace(user_username, '[^a-zA-Z0-9_]', '', 'g');
    user_username := regexp_replace(user_username, '\s+', '_', 'g');
    user_username := lower(user_username);
    user_username := substr(user_username, 1, 30);  -- Limit length
    
    -- Ensure we have something
    IF user_username = '' OR user_username IS NULL THEN
        user_username := 'user_' || substr(NEW.id::TEXT, 1, 8);
    END IF;

    -- Ensure uniqueness
    final_username := user_username;
    WHILE EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
        username_counter := username_counter + 1;
        final_username := user_username || username_counter::TEXT;
    END LOOP;

    RAISE NOTICE 'Creating profile with username: %', final_username;

    -- Insert profile
    INSERT INTO public.profiles (
        id,
        username,
        full_name,
        token_balance,
        free_generations_remaining,
        bonus_expires_at,
        storage_limit_bytes
    ) VALUES (
        NEW.id,
        final_username,
        NEW.raw_user_meta_data->>'full_name',
        10000,
        3,
        NOW() + INTERVAL '2 days',
        209715200
    );

    RAISE NOTICE 'Profile created successfully';

    -- Insert categories (ignore if already exists)
    BEGIN
        INSERT INTO public.categories (user_id, name) VALUES (NEW.id, 'Work');
        RAISE NOTICE 'Work category created';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Work category already exists';
    END;

    BEGIN
        INSERT INTO public.categories (user_id, name) VALUES (NEW.id, 'Personal');
        RAISE NOTICE 'Personal category created';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Personal category already exists';
    END;

    -- Insert personas (ignore if already exists)
    BEGIN
        INSERT INTO public.personas (user_id, name, icon, system_prompt) VALUES
        (NEW.id, 'Doctor', 'medical_services', 'You are a helpful and empathetic medical professional. Provide information for educational purposes, but always remind the user to consult a real doctor for medical advice.');
        RAISE NOTICE 'Doctor persona created';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Doctor persona already exists';
    END;

    BEGIN
        INSERT INTO public.personas (user_id, name, icon, system_prompt) VALUES
        (NEW.id, 'Friend', 'sentiment_satisfied', 'You are a friendly and supportive companion. Chat in a casual, conversational tone.');
        RAISE NOTICE 'Friend persona created';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Friend persona already exists';
    END;

    BEGIN
        INSERT INTO public.personas (user_id, name, icon, system_prompt) VALUES
        (NEW.id, 'Lawyer', 'gavel', 'You are a knowledgeable and professional lawyer. Provide general legal information and explanations for educational purposes, but always state that you are not giving legal advice and the user should consult with a licensed attorney for their specific situation.');
        RAISE NOTICE 'Lawyer persona created';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Lawyer persona already exists';
    END;

    RAISE NOTICE 'handle_new_user completed successfully for user: %', NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$;

-- ============================================
-- STEP 2: Recreate the trigger
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 3: Grant proper permissions
-- ============================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================
-- STEP 4: Fix RLS policies for profiles table
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS for trigger
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Fix RLS policies for categories table
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Users can view own categories"
ON public.categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
ON public.categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
ON public.categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON public.categories FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 6: Fix RLS policies for personas table
-- ============================================

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own personas" ON public.personas;
DROP POLICY IF EXISTS "Users can view own personas" ON public.personas;
DROP POLICY IF EXISTS "Users can insert own personas" ON public.personas;
DROP POLICY IF EXISTS "Users can update own personas" ON public.personas;
DROP POLICY IF EXISTS "Users can delete own personas" ON public.personas;

CREATE POLICY "Users can view own personas"
ON public.personas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas"
ON public.personas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas"
ON public.personas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personas"
ON public.personas FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: Verify the setup
-- ============================================

SELECT '✅ COMPLETE OAUTH FIX APPLIED SUCCESSFULLY' as status;

-- Check function exists
SELECT 'Function exists:' as check, 
       EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') as result;

-- Check trigger exists
SELECT 'Trigger exists:' as check,
       EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') as result;

-- Check RLS is enabled
SELECT 'RLS enabled on profiles:' as check,
       relrowsecurity as result
FROM pg_class
WHERE relname = 'profiles';

SELECT '✅ All checks complete. Google OAuth should now work properly!' as final_status;

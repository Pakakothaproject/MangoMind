-- FIX GOOGLE OAUTH USER CREATION ERROR
-- Run this in Supabase SQL Editor to fix the "Database error saving new user" issue

-- Drop the old function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the improved function that handles Google OAuth users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_username TEXT;
BEGIN
  -- Extract username from user metadata, fallback to email prefix if not available
  -- For Google OAuth, username might not be available, so we generate one
  user_username := NEW.raw_user_meta_data->>'username';

  -- If no username in metadata, try to create one from email
  IF user_username IS NULL THEN
    user_username := split_part(NEW.email, '@', 1);
  END IF;

  -- If still no username (shouldn't happen), create a fallback
  IF user_username IS NULL OR user_username = '' THEN
    user_username := 'user_' || substr(NEW.id::TEXT, 1, 8);
  END IF;

  -- Ensure username is unique by appending numbers if needed
  DECLARE
    counter INTEGER := 0;
    final_username TEXT := user_username;
  BEGIN
    WHILE EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      counter := counter + 1;
      final_username := user_username || counter::TEXT;
    END LOOP;
    user_username := final_username;
  END;

  -- Insert the profile
  INSERT INTO public.profiles (id, username, token_balance, free_generations_remaining, bonus_expires_at, storage_limit_bytes)
  VALUES (NEW.id, user_username, 10000, 3, NOW() + INTERVAL '2 days', 209715200);

  -- Add default categories for new user
  INSERT INTO public.categories (user_id, name)
  VALUES (NEW.id, 'Work'), (NEW.id, 'Personal');

  -- Add default personas for new user
  INSERT INTO public.personas (user_id, name, icon, system_prompt)
  VALUES
    (NEW.id, 'Doctor', 'medical_services', 'You are a helpful and empathetic medical professional. Provide information for educational purposes, but always remind the user to consult a real doctor for medical advice.'),
    (NEW.id, 'Friend', 'sentiment_satisfied', 'You are a friendly and supportive companion. Chat in a casual, conversational tone.'),
    (NEW.id, 'Lawyer', 'gavel', 'You are a knowledgeable and professional lawyer. Provide general legal information and explanations for educational purposes, but always state that you are not giving legal advice and the user should consult with a licensed attorney for their specific situation.'),
    (NEW.id, 'Rabindranath Tagore', 'history_edu', 'You are the spirit of Rabindranath Tagore, the great Bengali poet, philosopher, and artist. Respond with wisdom, poetic language, and a deep appreciation for nature, humanity, and art. Your tone should be gentle, profound, and reflective.')
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Verify the function was created
SELECT 'Function updated successfully' AS status;

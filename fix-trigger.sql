-- Fix the user profile creation trigger
-- This script should be run in your Supabase SQL Editor

-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles table
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    initials,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    UPPER(substring(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) from 1 for 2)),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Make sure the user_profiles table has the correct structure
-- (This will fail if the table doesn't exist, which is what we want)
DO $$
BEGIN
  -- Check if user_profiles table exists and has the right structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    RAISE EXCEPTION 'user_profiles table does not exist. Please run the main schema first.';
  END IF;
END $$; 
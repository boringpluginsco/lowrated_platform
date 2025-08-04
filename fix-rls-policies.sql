-- Fix RLS policies for user_profiles table
-- This script should be run in your Supabase SQL Editor

-- First, disable RLS temporarily to fix the policies
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create new, simpler policies that won't cause recursion
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to do everything (for triggers)
CREATE POLICY "Service role can do everything" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Update the trigger function to use service role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles table using service role context
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

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create RPC function for manual profile creation
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'user',
  user_initials TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_profile user_profiles%ROWTYPE;
BEGIN
  -- Insert the profile
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    initials,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_full_name,
    user_role,
    COALESCE(user_initials, UPPER(substring(user_full_name from 1 for 2))),
    NOW(),
    NOW()
  ) RETURNING * INTO new_profile;
  
  -- Return the created profile as JSON
  RETURN row_to_json(new_profile);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
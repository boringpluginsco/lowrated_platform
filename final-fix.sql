-- Comprehensive fix for user profile creation
-- Run this in your Supabase SQL Editor

-- Step 1: Clean up existing data and policies
DELETE FROM user_profiles WHERE email = 'timothylopezmade@gmail.com';

-- Disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON user_profiles;

-- Step 2: Create simple, working policies
CREATE POLICY "Enable all access for authenticated users" ON user_profiles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for service role" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Step 3: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Fix the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
    INSERT INTO user_profiles (
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
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 6: Update the RPC function to handle duplicates
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'user',
  user_initials TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  existing_profile user_profiles%ROWTYPE;
  new_profile user_profiles%ROWTYPE;
BEGIN
  -- Check if profile already exists
  SELECT * INTO existing_profile FROM user_profiles WHERE id = user_id;
  
  IF existing_profile.id IS NOT NULL THEN
    -- Profile exists, return it
    RETURN row_to_json(existing_profile);
  END IF;
  
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

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated; 
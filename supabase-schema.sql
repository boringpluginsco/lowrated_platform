-- Enable Row Level Security
-- Note: JWT secret is automatically managed by Supabase

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom user profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  initials TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  number_of_leads INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'ready_for_download', 'failed')),
  task_id TEXT,
  download_url TEXT,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_business_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rating DECIMAL(3,1),
  reviews_count INTEGER,
  address TEXT,
  domain TEXT,
  is_verified BOOLEAN DEFAULT false,
  social_links JSONB DEFAULT '{}',
  phone TEXT,
  description TEXT,
  category TEXT,
  business_type TEXT,
  full_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  business_status TEXT,
  about TEXT,
  prices TEXT,
  working_hours TEXT,
  email_1 TEXT,
  email_2 TEXT,
  email_3 TEXT,
  phone_1 TEXT,
  phone_2 TEXT,
  phone_3 TEXT,
  website_title TEXT,
  website_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('New', 'Contacted', 'Engaged', 'Qualified', 'Converted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE TABLE IF NOT EXISTS starred_businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('directory', 'google')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, business_id, business_type)
);

CREATE TABLE IF NOT EXISTS email_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  emails JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_businesses_google_id ON google_businesses(google_business_id);
CREATE INDEX IF NOT EXISTS idx_google_businesses_name ON google_businesses(name);
CREATE INDEX IF NOT EXISTS idx_business_stages_user_id ON business_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_business_stages_business_id ON business_stages(business_id);
CREATE INDEX IF NOT EXISTS idx_starred_businesses_user_id ON starred_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_starred_businesses_type ON starred_businesses(business_type);
CREATE INDEX IF NOT EXISTS idx_email_threads_user_id ON email_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_business_id ON email_threads(business_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE starred_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can view their own profile" ON user_profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can update their own profile" ON user_profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Admins can view all profiles" ON user_profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Scraping jobs policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own scraping jobs' AND tablename = 'scraping_jobs') THEN
    CREATE POLICY "Users can view their own scraping jobs" ON scraping_jobs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own scraping jobs' AND tablename = 'scraping_jobs') THEN
    CREATE POLICY "Users can insert their own scraping jobs" ON scraping_jobs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own scraping jobs' AND tablename = 'scraping_jobs') THEN
    CREATE POLICY "Users can update their own scraping jobs" ON scraping_jobs
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own scraping jobs' AND tablename = 'scraping_jobs') THEN
    CREATE POLICY "Users can delete their own scraping jobs" ON scraping_jobs
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Business stages policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own business stages' AND tablename = 'business_stages') THEN
    CREATE POLICY "Users can view their own business stages" ON business_stages
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own business stages' AND tablename = 'business_stages') THEN
    CREATE POLICY "Users can insert their own business stages" ON business_stages
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own business stages' AND tablename = 'business_stages') THEN
    CREATE POLICY "Users can update their own business stages" ON business_stages
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own business stages' AND tablename = 'business_stages') THEN
    CREATE POLICY "Users can delete their own business stages" ON business_stages
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Starred businesses policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own starred businesses' AND tablename = 'starred_businesses') THEN
    CREATE POLICY "Users can view their own starred businesses" ON starred_businesses
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own starred businesses' AND tablename = 'starred_businesses') THEN
    CREATE POLICY "Users can insert their own starred businesses" ON starred_businesses
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own starred businesses' AND tablename = 'starred_businesses') THEN
    CREATE POLICY "Users can delete their own starred businesses" ON starred_businesses
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Google businesses policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all google businesses' AND tablename = 'google_businesses') THEN
    CREATE POLICY "Users can view all google businesses" ON google_businesses
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert google businesses' AND tablename = 'google_businesses') THEN
    CREATE POLICY "Users can insert google businesses" ON google_businesses
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update google businesses' AND tablename = 'google_businesses') THEN
    CREATE POLICY "Users can update google businesses" ON google_businesses
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete google businesses' AND tablename = 'google_businesses') THEN
    CREATE POLICY "Users can delete google businesses" ON google_businesses
      FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Email threads policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own email threads' AND tablename = 'email_threads') THEN
    CREATE POLICY "Users can view their own email threads" ON email_threads
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own email threads' AND tablename = 'email_threads') THEN
    CREATE POLICY "Users can insert their own email threads" ON email_threads
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own email threads' AND tablename = 'email_threads') THEN
    CREATE POLICY "Users can update their own email threads" ON email_threads
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own email threads' AND tablename = 'email_threads') THEN
    CREATE POLICY "Users can delete their own email threads" ON email_threads
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role, initials)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    UPPER(substring(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) from 1 for 2))
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    CREATE TRIGGER update_user_profiles_updated_at 
      BEFORE UPDATE ON user_profiles 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_scraping_jobs_updated_at') THEN
    CREATE TRIGGER update_scraping_jobs_updated_at 
      BEFORE UPDATE ON scraping_jobs 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_google_businesses_updated_at') THEN
    CREATE TRIGGER update_google_businesses_updated_at 
      BEFORE UPDATE ON google_businesses 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_stages_updated_at') THEN
    CREATE TRIGGER update_business_stages_updated_at 
      BEFORE UPDATE ON business_stages 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_threads_updated_at') THEN
    CREATE TRIGGER update_email_threads_updated_at 
      BEFORE UPDATE ON email_threads 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- Insert default admin user (optional - you can remove this)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   uuid_generate_v4(),
--   'admin@demo.com',
--   crypt('demo123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- ); 
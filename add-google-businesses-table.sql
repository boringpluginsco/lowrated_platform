-- Migration: Add google_businesses table
-- Run this SQL in your Supabase SQL Editor to add the new table

-- Create the google_businesses table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_businesses_google_id ON google_businesses(google_business_id);
CREATE INDEX IF NOT EXISTS idx_google_businesses_name ON google_businesses(name);

-- Enable Row Level Security
ALTER TABLE google_businesses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create trigger for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_google_businesses_updated_at') THEN
    CREATE TRIGGER update_google_businesses_updated_at 
      BEFORE UPDATE ON google_businesses 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON google_businesses TO authenticated;
GRANT ALL ON google_businesses TO service_role; 
-- Migration script to add new fields to google_businesses table
-- Run this in your Supabase SQL editor

-- Add new columns to google_businesses table
ALTER TABLE google_businesses 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS full_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS business_status TEXT,
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS prices TEXT,
ADD COLUMN IF NOT EXISTS working_hours TEXT,
ADD COLUMN IF NOT EXISTS email_1 TEXT,
ADD COLUMN IF NOT EXISTS email_2 TEXT,
ADD COLUMN IF NOT EXISTS email_3 TEXT,
ADD COLUMN IF NOT EXISTS phone_1 TEXT,
ADD COLUMN IF NOT EXISTS phone_2 TEXT,
ADD COLUMN IF NOT EXISTS phone_3 TEXT,
ADD COLUMN IF NOT EXISTS website_title TEXT,
ADD COLUMN IF NOT EXISTS website_description TEXT;

-- Update social_links to include twitter and youtube
-- Note: This will need to be done manually for existing records
-- New records will automatically include these fields

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_businesses_category ON google_businesses(category);
CREATE INDEX IF NOT EXISTS idx_google_businesses_city ON google_businesses(city);
CREATE INDEX IF NOT EXISTS idx_google_businesses_state ON google_businesses(state);
CREATE INDEX IF NOT EXISTS idx_google_businesses_country ON google_businesses(country);
CREATE INDEX IF NOT EXISTS idx_google_businesses_business_status ON google_businesses(business_status);

-- Update RLS policies to include new columns
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view google_businesses" ON google_businesses;
DROP POLICY IF EXISTS "Users can insert google_businesses" ON google_businesses;
DROP POLICY IF EXISTS "Users can update google_businesses" ON google_businesses;
DROP POLICY IF EXISTS "Users can delete google_businesses" ON google_businesses;

-- Recreate policies with all columns
CREATE POLICY "Users can view google_businesses" ON google_businesses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert google_businesses" ON google_businesses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update google_businesses" ON google_businesses
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete google_businesses" ON google_businesses
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'google_businesses' 
ORDER BY ordinal_position; 
-- Fix Supabase schema: Add status column and allow 0 hours
-- Run this in your Supabase SQL Editor

-- Step 1: Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'timesheet_time_entries' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE timesheet_time_entries 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
    
    RAISE NOTICE 'Status column added successfully';
  ELSE
    RAISE NOTICE 'Status column already exists';
  END IF;
END $$;

-- Step 2: Update hours constraint to allow 0
ALTER TABLE timesheet_time_entries 
DROP CONSTRAINT IF EXISTS timesheet_time_entries_hours_check;

ALTER TABLE timesheet_time_entries 
ADD CONSTRAINT timesheet_time_entries_hours_check 
CHECK (hours >= 0 AND hours <= 24);

-- Step 3: Add Onyx Government Services TTB project if it doesn't exist
INSERT INTO timesheet_projects (id, name, description, created_at)
VALUES ('2', 'Onyx Government Services TTB', 'Supporting SAS Analytics', NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create user login tracking table
CREATE TABLE IF NOT EXISTS timesheet_user_logins (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES timesheet_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_timesheet_user_logins_user_id ON timesheet_user_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_user_logins_login_at ON timesheet_user_logins(login_at);



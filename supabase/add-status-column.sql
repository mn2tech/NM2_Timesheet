-- Add status column to timesheet_time_entries table if it doesn't exist
-- Run this in your Supabase SQL editor

-- Check if column exists and add it if it doesn't
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

-- Also update the hours constraint to allow 0
ALTER TABLE timesheet_time_entries 
DROP CONSTRAINT IF EXISTS timesheet_time_entries_hours_check;

ALTER TABLE timesheet_time_entries 
ADD CONSTRAINT timesheet_time_entries_hours_check 
CHECK (hours >= 0 AND hours <= 24);



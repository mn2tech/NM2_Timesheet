-- Timesheet App Tables (prefixed with 'timesheet_' to avoid conflicts with other apps)
-- Note: Using TEXT for IDs to match existing database structure

-- Users table
CREATE TABLE IF NOT EXISTS timesheet_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'contractor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS timesheet_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time entries table
CREATE TABLE IF NOT EXISTS timesheet_time_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES timesheet_users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  project TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_timesheet_time_entries_user_id ON timesheet_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_time_entries_date ON timesheet_time_entries(date);
CREATE INDEX IF NOT EXISTS idx_timesheet_users_email ON timesheet_users(email);

-- Insert default project
INSERT INTO timesheet_projects (id, name, description, created_at)
VALUES ('1', 'General', 'General work hours', NOW())
ON CONFLICT (id) DO NOTHING;



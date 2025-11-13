# Supabase Setup Guide

This guide will help you set up Supabase for the NM2TECH LLC Timesheet Application.

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: NM2TECH Timesheet (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be set up (takes 1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")
   - **service_role key** (under "Project API keys" → "service_role" - keep this secret!)

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the project root (copy from `.env.local.example`)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-secret-key-change-in-production
ADMIN_SECRET=NM2TECH-ADMIN-2024
```

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run" (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

The schema will create:
- `users` table (for employees, contractors, and admins)
- `projects` table (for project tracking)
- `time_entries` table (for time entries)
- Indexes for better performance
- A default "General" project

## Step 5: Verify Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. The app will automatically use Supabase if the environment variables are set
3. If Supabase is not configured, it will fall back to JSON file storage

## Step 6: Migrate Existing Data (Optional)

If you have existing data in `data/db.json`, you can migrate it to Supabase:

1. Export your JSON data
2. Use the Supabase dashboard or create a migration script to import users and time entries

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists and has the correct variable names
- Restart your development server after adding environment variables

### "relation does not exist"
- Make sure you ran the SQL schema in Step 4
- Check that the tables were created in the Supabase dashboard (Table Editor)

### Connection issues
- Verify your Project URL is correct
- Check that your API keys are correct
- Ensure your Supabase project is active (not paused)

## Security Notes

- **Never commit** `.env.local` to version control (it's already in `.gitignore`)
- The `anon` key is safe to expose in client-side code
- The `service_role` key has admin access - keep it secret!
- Consider using Row Level Security (RLS) policies in Supabase for additional security

## Next Steps

Once Supabase is set up:
- Your data will be stored in the cloud
- Multiple users can access the same database
- You get automatic backups
- Better performance and scalability

For production, consider:
- Setting up Row Level Security policies
- Configuring database backups
- Setting up monitoring and alerts
- Using Supabase Auth for better security (optional upgrade)



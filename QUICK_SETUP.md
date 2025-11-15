# Quick Setup Guide for Existing Supabase Project

Since you already have a Supabase project, follow these steps:

## Step 1: Get Your API Keys

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy these values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (optional, for admin operations - keep secret!)

## Step 2: Create Environment File

1. Create a `.env.local` file in the project root
2. Copy the template from `.env.local.example` or use this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-secret-key-change-in-production
ADMIN_SECRET=NM2TECH-ADMIN-2024
```

3. Replace the values with your actual Supabase credentials

## Step 3: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
5. You should see "Success. No rows returned" or similar success message

This will create:
- `users` table
- `projects` table  
- `time_entries` table
- Indexes for performance
- A default "General" project

## Step 4: Verify Tables Were Created

1. In Supabase dashboard, go to **Table Editor**
2. You should see three tables: `users`, `projects`, and `time_entries`
3. The `projects` table should have one row (the "General" project)

## Step 5: Start the Application

1. Make sure your `.env.local` file is set up correctly
2. Restart your development server:
   ```bash
   npm run dev
   ```

3. The app will automatically use Supabase now!

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the project root
- Check that variable names start with `NEXT_PUBLIC_` for client-side variables
- Restart the dev server after creating/updating `.env.local`

### "relation does not exist" error
- Make sure you ran the SQL schema in Step 3
- Check the Table Editor to verify tables exist

### Still using JSON file storage?
- Check that your environment variables are set correctly
- Make sure there are no typos in variable names
- Restart the dev server

## Next Steps

Once everything is working:
- You can start registering users and creating time entries
- All data will be stored in your Supabase database
- You can view/manage data in the Supabase dashboard






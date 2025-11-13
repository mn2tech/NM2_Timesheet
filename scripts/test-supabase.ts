/**
 * Test script to verify Supabase connection and tables
 * Run with: npx tsx scripts/test-supabase.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST, before any other imports
config({ path: resolve(process.cwd(), '.env.local') });

// Now import supabase after env vars are loaded
const { supabase } = require('../lib/supabase');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Check if Supabase is configured
  if (!supabase) {
    console.error('❌ Supabase client is not initialized!');
    console.error('   Check your .env.local file has:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ Supabase client initialized\n');

  // Test users table
  console.log('📊 Testing timesheet_users table...');
  const { data: users, error: usersError } = await supabase
    .from('timesheet_users')
    .select('count')
    .limit(1);

  if (usersError) {
    console.error('❌ Error accessing timesheet_users:', usersError.message);
    console.error('   Code:', usersError.code);
    console.error('   Details:', usersError.details);
    console.error('   Hint:', usersError.hint);
  } else {
    console.log('✅ timesheet_users table accessible');
  }

  // Test projects table
  console.log('\n📊 Testing timesheet_projects table...');
  const { data: projects, error: projectsError } = await supabase
    .from('timesheet_projects')
    .select('*')
    .limit(1);

  if (projectsError) {
    console.error('❌ Error accessing timesheet_projects:', projectsError.message);
  } else {
    console.log('✅ timesheet_projects table accessible');
    console.log(`   Found ${projects?.length || 0} project(s)`);
  }

  // Test time_entries table
  console.log('\n📊 Testing timesheet_time_entries table...');
  const { data: entries, error: entriesError } = await supabase
    .from('timesheet_time_entries')
    .select('count')
    .limit(1);

  if (entriesError) {
    console.error('❌ Error accessing timesheet_time_entries:', entriesError.message);
  } else {
    console.log('✅ timesheet_time_entries table accessible');
  }

  // Count users
  console.log('\n👥 Checking users...');
  const { count: userCount, error: countError } = await supabase
    .from('timesheet_users')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting users:', countError.message);
  } else {
    console.log(`   Total users: ${userCount || 0}`);
    if (userCount === 0) {
      console.log('   ⚠️  No users found. You may need to migrate data or create users.');
    }
  }

  console.log('\n✨ Test complete!');
}

testConnection().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});


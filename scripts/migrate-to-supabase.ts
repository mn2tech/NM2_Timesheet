/**
 * Migration script to move data from db.json to Supabase
 * Run with: npx tsx scripts/migrate-to-supabase.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Now import supabase after env vars are loaded
const { supabase } = require('../lib/supabase');

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  createdAt: string;
}

interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  hours: number;
  project: string;
  description: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Database {
  users: User[];
  timeEntries: TimeEntry[];
  projects: Project[];
}

async function migrate() {
  console.log('🚀 Starting migration from JSON to Supabase...\n');

  // Check if Supabase is configured
  if (!supabase) {
    console.error('❌ Supabase is not configured. Please set up your .env.local file.');
    process.exit(1);
  }

  // Read JSON data
  const dbPath = join(process.cwd(), 'data', 'db.json');
  let db: Database;
  
  try {
    const fileContent = readFileSync(dbPath, 'utf-8');
    db = JSON.parse(fileContent);
  } catch (error) {
    console.error('❌ Failed to read db.json:', error);
    process.exit(1);
  }

  console.log(`📊 Found ${db.users.length} users, ${db.timeEntries.length} time entries, ${db.projects.length} projects\n`);

  // Migrate Projects first (no dependencies)
  console.log('📦 Migrating projects...');
  for (const project of db.projects) {
    const { data, error } = await supabase
      .from('timesheet_projects')
      .upsert({
        id: project.id,
        name: project.name,
        description: project.description || null,
        created_at: project.createdAt,
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error(`  ❌ Failed to migrate project ${project.name}:`, error.message);
    } else {
      console.log(`  ✅ Migrated project: ${project.name}`);
    }
  }

  // Migrate Users
  console.log('\n👥 Migrating users...');
  for (const user of db.users) {
    const { data, error } = await supabase
      .from('timesheet_users')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password,
        role: user.role,
        created_at: user.createdAt,
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error(`  ❌ Failed to migrate user ${user.email}:`, error.message);
    } else {
      console.log(`  ✅ Migrated user: ${user.name} (${user.email})`);
    }
  }

  // Migrate Time Entries (depends on users)
  console.log('\n⏰ Migrating time entries...');
  for (const entry of db.timeEntries) {
    const { data, error } = await supabase
      .from('timesheet_time_entries')
      .upsert({
        id: entry.id,
        user_id: entry.userId,
        date: entry.date,
        hours: entry.hours,
        project: entry.project,
        description: entry.description || null,
        created_at: entry.createdAt,
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error(`  ❌ Failed to migrate time entry ${entry.id}:`, error.message);
    } else {
      console.log(`  ✅ Migrated time entry: ${entry.date} (${entry.hours} hours)`);
    }
  }

  console.log('\n✨ Migration complete!');
  console.log('\n📝 Note: Your original db.json file is unchanged.');
  console.log('   You can continue using it as a backup or delete it if everything looks good.');
}

migrate().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});


/**
 * Script to reset a user's password
 * Run with: npx tsx scripts/reset-password.ts [email] [new-password]
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Now import after env vars are loaded
const { hashPassword } = require('../lib/auth');
const { db } = require('../lib/db-wrapper');

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Usage: npx tsx scripts/reset-password.ts [email] [new-password]');
    console.error('   Example: npx tsx scripts/reset-password.ts user@example.com newpassword123');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    process.exit(1);
  }

  try {
    // Find user
    const user = await db.users.findByEmail(email);
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password using the db wrapper
    const updated = await db.users.update(user.id, { password: hashedPassword });
    
    if (!updated) {
      console.error('❌ Failed to update password');
      process.exit(1);
    }

    console.log('✅ Password reset successfully!');
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   New password: ${newPassword}`);
    console.log('\n⚠️  User should change this password after logging in!');
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword().catch((error) => {
  console.error('❌ Failed:', error);
  process.exit(1);
});


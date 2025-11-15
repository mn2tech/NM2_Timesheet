import { db } from '../lib/db';
import { hashPassword } from '../lib/auth';

async function createAdmin() {
  const email = process.argv[2] || 'admin@nm2tech.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin User';

  // Check if admin already exists
  const existing = db.users.findByEmail(email);
  if (existing) {
    console.log(`❌ User with email ${email} already exists!`);
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);
  const admin = db.users.create({
    email,
    name,
    password: hashedPassword,
    role: 'admin',
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name: ${admin.name}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Password: ${password}`);
  console.log('\n⚠️  Please change the password after first login!');
}

createAdmin().catch(console.error);







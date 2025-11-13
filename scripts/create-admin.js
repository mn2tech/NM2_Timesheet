const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readDB() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const defaultDB = {
      users: [],
      timeEntries: [],
      projects: [
        {
          id: '1',
          name: 'General',
          description: 'General work hours',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    writeDB(defaultDB);
    return defaultDB;
  }
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDB(db) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

async function createAdmin() {
  const email = process.argv[2] || 'admin@nm2tech.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin User';

  const db = readDB();

  // Check if admin already exists
  const existing = db.users.find(u => u.email === email);
  if (existing) {
    console.log(`❌ User with email ${email} already exists!`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = {
    id: Date.now().toString(),
    email,
    name,
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  db.users.push(admin);
  writeDB(db);

  console.log('✅ Admin user created successfully!');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name: ${admin.name}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Password: ${password}`);
  console.log('\n⚠️  Please change the password after first login!');
}

createAdmin().catch(console.error);



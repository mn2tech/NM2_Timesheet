import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  role: 'employee' | 'contractor' | 'admin';
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  project: string;
  description: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Check if Supabase is configured
const useSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Import Supabase DB if available
let supabaseDb: any = null;
if (useSupabase) {
  try {
    supabaseDb = require('./supabase-db').supabaseDb;
  } catch (error) {
    console.warn('Supabase configured but module not available, falling back to JSON');
  }
}

interface Database {
  users: User[];
  timeEntries: TimeEntry[];
  projects: Project[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readDB(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const defaultDB: Database = {
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

function writeDB(db: Database): void {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write database file:', error);
    throw new Error(`Database write failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const db = {
  users: {
    findById: (id: string): User | undefined => {
      const db = readDB();
      return db.users.find((u) => u.id === id);
    },
    findByEmail: (email: string): User | undefined => {
      const db = readDB();
      return db.users.find((u) => u.email === email);
    },
    create: (user: Omit<User, 'id' | 'createdAt'>): User => {
      const db = readDB();
      const newUser: User = {
        ...user,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      writeDB(db);
      return newUser;
    },
    getAll: (): User[] => {
      return readDB().users;
    },
    delete: (id: string): boolean => {
      const db = readDB();
      const index = db.users.findIndex((u) => u.id === id);
      if (index === -1) return false;
      db.users.splice(index, 1);
      writeDB(db);
      return true;
    },
  },
  timeEntries: {
    findByUserId: (userId: string): TimeEntry[] => {
      const db = readDB();
      return db.timeEntries.filter((te) => te.userId === userId);
    },
    findById: (id: string): TimeEntry | undefined => {
      const db = readDB();
      return db.timeEntries.find((te) => te.id === id);
    },
    create: (entry: Omit<TimeEntry, 'id' | 'createdAt'>): TimeEntry => {
      const db = readDB();
      const newEntry: TimeEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      db.timeEntries.push(newEntry);
      writeDB(db);
      return newEntry;
    },
    update: (id: string, updates: Partial<TimeEntry>): TimeEntry | null => {
      const db = readDB();
      const index = db.timeEntries.findIndex((te) => te.id === id);
      if (index === -1) return null;
      db.timeEntries[index] = { ...db.timeEntries[index], ...updates };
      writeDB(db);
      return db.timeEntries[index];
    },
    delete: (id: string): boolean => {
      const db = readDB();
      const index = db.timeEntries.findIndex((te) => te.id === id);
      if (index === -1) return false;
      db.timeEntries.splice(index, 1);
      writeDB(db);
      return true;
    },
    getAll: (): TimeEntry[] => {
      return readDB().timeEntries;
    },
  },
  projects: {
    getAll: (): Project[] => {
      return readDB().projects;
    },
    findById: (id: string): Project | undefined => {
      const db = readDB();
      return db.projects.find((p) => p.id === id);
    },
    create: (project: Omit<Project, 'id' | 'createdAt'>): Project => {
      const db = readDB();
      const newProject: Project = {
        ...project,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      db.projects.push(newProject);
      writeDB(db);
      return newProject;
    },
  },
};


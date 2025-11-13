// This file exports the appropriate database implementation
// If Supabase is configured, use it; otherwise use JSON file storage

import { User, TimeEntry, Project } from './db';

// Check if Supabase is configured
const useSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let dbImplementation: any;

if (useSupabase) {
  // Use Supabase
  const { supabaseDb } = require('./supabase-db');
  dbImplementation = supabaseDb;
} else {
  // Use JSON file storage
  const { db } = require('./db');
  dbImplementation = db;
}

// Export with async wrappers (JSON operations are wrapped in Promise.resolve for compatibility)
export const db = {
  users: {
    findById: async (id: string): Promise<User | undefined> => {
      if (useSupabase) {
        return await dbImplementation.users.findById(id);
      }
      return Promise.resolve(dbImplementation.users.findById(id));
    },
    findByEmail: async (email: string): Promise<User | undefined> => {
      if (useSupabase) {
        return await dbImplementation.users.findByEmail(email);
      }
      return Promise.resolve(dbImplementation.users.findByEmail(email));
    },
    create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
      if (useSupabase) {
        return await dbImplementation.users.create(user);
      }
      return Promise.resolve(dbImplementation.users.create(user));
    },
    getAll: async (): Promise<User[]> => {
      if (useSupabase) {
        return await dbImplementation.users.getAll();
      }
      return Promise.resolve(dbImplementation.users.getAll());
    },
    delete: async (id: string): Promise<boolean> => {
      if (useSupabase) {
        return await dbImplementation.users.delete(id);
      }
      return Promise.resolve(dbImplementation.users.delete(id));
    },
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      if (useSupabase) {
        return await dbImplementation.users.update(id, updates);
      }
      // For JSON storage, we'd need to implement update in db.ts
      return Promise.resolve(null);
    },
  },
  timeEntries: {
    findByUserId: async (userId: string): Promise<TimeEntry[]> => {
      if (useSupabase) {
        return await dbImplementation.timeEntries.findByUserId(userId);
      }
      return Promise.resolve(dbImplementation.timeEntries.findByUserId(userId));
    },
    findById: async (id: string): Promise<TimeEntry | undefined> => {
      if (useSupabase) {
        return await dbImplementation.timeEntries.findById(id);
      }
      return Promise.resolve(dbImplementation.timeEntries.findById(id));
    },
    create: async (entry: Omit<TimeEntry, 'id' | 'createdAt'>): Promise<TimeEntry> => {
      if (useSupabase) {
        return await dbImplementation.timeEntries.create(entry);
      }
      return Promise.resolve(dbImplementation.timeEntries.create(entry));
    },
    update: async (id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> => {
      if (useSupabase) {
        return await dbImplementation.timeEntries.update(id, updates);
      }
      return Promise.resolve(dbImplementation.timeEntries.update(id, updates));
    },
    delete: async (id: string): Promise<boolean> => {
      if (useSupabase) {
        return await dbImplementation.timeEntries.delete(id);
      }
      return Promise.resolve(dbImplementation.timeEntries.delete(id));
    },
    getAll: async (): Promise<TimeEntry[]> => {
      if (useSupabase) {
        return await dbImplementation.timeEntries.getAll();
      }
      return Promise.resolve(dbImplementation.timeEntries.getAll());
    },
  },
  projects: {
    getAll: async (): Promise<Project[]> => {
      if (useSupabase) {
        return await dbImplementation.projects.getAll();
      }
      return Promise.resolve(dbImplementation.projects.getAll());
    },
    findById: async (id: string): Promise<Project | undefined> => {
      if (useSupabase) {
        return await dbImplementation.projects.findById(id);
      }
      return Promise.resolve(dbImplementation.projects.findById(id));
    },
    create: async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
      if (useSupabase) {
        return await dbImplementation.projects.create(project);
      }
      return Promise.resolve(dbImplementation.projects.create(project));
    },
  },
};


import { supabase, supabaseAdmin } from './supabase';
import { User, TimeEntry, Project } from './db';

// Helper to check if Supabase is available
function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Check your environment variables.');
  }
  return supabase;
}

// Convert Supabase row to User
function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    password: row.password,
    role: row.role,
    createdAt: row.created_at,
  };
}

// Convert Supabase row to TimeEntry
function rowToTimeEntry(row: any): TimeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    hours: parseFloat(row.hours),
    project: row.project,
    description: row.description || '',
    createdAt: row.created_at,
  };
}

// Convert Supabase row to Project
function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

export const supabaseDb = {
  users: {
    findById: async (id: string): Promise<User | undefined> => {
      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return rowToUser(data);
    },
    findByEmail: async (email: string): Promise<User | undefined> => {
      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) return undefined;
      return rowToUser(data);
    },
    create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
      const client = ensureSupabase();
      // Generate ID (using timestamp like JSON version for consistency)
      const id = Date.now().toString();
      const { data, error } = await client
        .from('timesheet_users')
        .insert({
          id: id,
          email: user.email,
          name: user.name,
          password: user.password,
          role: user.role,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToUser(data);
    },
    getAll: async (): Promise<User[]> => {
      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(rowToUser);
    },
    delete: async (id: string): Promise<boolean> => {
      const client = ensureSupabase();
      const { error } = await client
        .from('timesheet_users')
        .delete()
        .eq('id', id);

      return !error;
    },
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      const client = ensureSupabase();
      const updateData: any = {};
      
      if (updates.email) updateData.email = updates.email;
      if (updates.name) updateData.name = updates.name;
      if (updates.password) updateData.password = updates.password;
      if (updates.role) updateData.role = updates.role;

      const { data, error } = await client
        .from('timesheet_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return null;
      return rowToUser(data);
    },
  },
  timeEntries: {
    findByUserId: async (userId: string): Promise<TimeEntry[]> => {
      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(rowToTimeEntry);
    },
    findById: async (id: string): Promise<TimeEntry | undefined> => {
      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_time_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return rowToTimeEntry(data);
    },
    create: async (entry: Omit<TimeEntry, 'id' | 'createdAt'>): Promise<TimeEntry> => {
      const client = ensureSupabase();
      // Generate ID (using timestamp like JSON version for consistency)
      const id = Date.now().toString();
      const { data, error } = await client
        .from('timesheet_time_entries')
        .insert({
          id: id,
          user_id: entry.userId,
          date: entry.date,
          hours: entry.hours,
          project: entry.project,
          description: entry.description,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToTimeEntry(data);
    },
    update: async (id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> => {
      const updateData: any = {};
      if (updates.date) updateData.date = updates.date;
      if (updates.hours !== undefined) updateData.hours = updates.hours;
      if (updates.project) updateData.project = updates.project;
      if (updates.description !== undefined) updateData.description = updates.description;

      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_time_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return null;
      return rowToTimeEntry(data);
    },
    delete: async (id: string): Promise<boolean> => {
      const client = ensureSupabase();
      const { error } = await client
        .from('time_entries')
        .delete()
        .eq('id', id);

      return !error;
    },
    getAll: async (): Promise<TimeEntry[]> => {
      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_time_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(rowToTimeEntry);
    },
  },
  projects: {
    getAll: async (): Promise<Project[]> => {
      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(rowToProject);
    },
    findById: async (id: string): Promise<Project | undefined> => {
      const client = ensureSupabase();
      const { data, error } = await client
        .from('timesheet_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return rowToProject(data);
    },
    create: async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
      const client = ensureSupabase();
      // Generate ID (using timestamp like JSON version for consistency)
      const id = Date.now().toString();
      const { data, error } = await client
        .from('timesheet_projects')
        .insert({
          id: id,
          name: project.name,
          description: project.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToProject(data);
    },
  },
};



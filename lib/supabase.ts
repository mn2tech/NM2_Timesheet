import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create clients only if environment variables are available
// This allows the app to work even if Supabase is not fully configured
let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Service role bypasses RLS — required for server API routes (custom JWT auth, not Supabase sessions)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } else {
      console.warn(
        'SUPABASE_SERVICE_ROLE_KEY is not set. Server login and DB operations will fail when RLS is enabled.'
      );
    }
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('Supabase environment variables not set. Using JSON file storage.');
}

/** Server-side DB client. Uses service role to bypass RLS (app auth is custom JWT, not Supabase Auth). */
export function getServerSupabase(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction || process.env.REQUIRE_SERVICE_ROLE_KEY === 'true') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it to .env and restart PM2. Required when RLS is enabled.'
    );
  }

  if (supabase) {
    console.warn(
      'Falling back to anon Supabase client on server. Set SUPABASE_SERVICE_ROLE_KEY when RLS is enabled.'
    );
    return supabase;
  }

  throw new Error(
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.'
  );
}

export { supabase, supabaseAdmin };



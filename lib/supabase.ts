import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getRuntimeEnv } from '@/lib/runtime-env';

function env(name: string): string | undefined {
  return getRuntimeEnv(name);
}

const supabaseUrl = env('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = env('NEXT_PUBLIC_SUPABASE_ANON_KEY');

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
  } catch (error) {
    console.error('Failed to initialize Supabase anon client:', error);
  }
} else {
  console.warn('Supabase environment variables not set. Using JSON file storage.');
}

function getOrCreateAdminClient(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;

  const url = env('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    return null;
  }

  supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdmin;
}

/** Server-side DB client. Uses service role to bypass RLS (app auth is custom JWT, not Supabase Auth). */
export function getServerSupabase(): SupabaseClient {
  const admin = getOrCreateAdminClient();
  if (admin) {
    return admin;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction || env('REQUIRE_SERVICE_ROLE_KEY') === 'true') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it to .env, run npm run build, and restart PM2.'
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

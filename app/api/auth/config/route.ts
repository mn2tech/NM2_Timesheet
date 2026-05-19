export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

/** GET /api/auth/config — safe diagnostics (no secrets). Use after deploy to verify server env. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    googleRouteVersion: 'email-lookup-v2',
  });
}

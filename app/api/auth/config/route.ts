export const dynamic = 'force-dynamic';

import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

function envFileHasKey(key: string): boolean {
  const root = process.cwd();
  for (const file of ['.env', '.env.production', '.env.local']) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.startsWith('export ')) trimmed = trimmed.slice(7).trim();
      if (trimmed.startsWith(`${key}=`)) return true;
    }
  }
  return false;
}

/** GET /api/auth/config — safe diagnostics (no secrets). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    cwd: process.cwd(),
    hasSupabaseUrl: !!process.env['NEXT_PUBLIC_SUPABASE_URL'],
    hasAnonKey: !!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    hasServiceRoleKey: !!process.env['SUPABASE_SERVICE_ROLE_KEY'],
    envFileHasServiceRoleKey: envFileHasKey('SUPABASE_SERVICE_ROLE_KEY'),
    hasJwtSecret: !!process.env['JWT_SECRET'],
    envFileHasJwtSecret: envFileHasKey('JWT_SECRET'),
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    googleRouteVersion: 'email-lookup-v3-load-env',
  });
}

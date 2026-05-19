export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db-wrapper';
import { generateToken, hashPassword } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import { getRuntimeEnv } from '@/lib/runtime-env';

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    if (!getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        {
          error:
            'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env and restart the app.',
        },
        { status: 503 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase is not configured on the server' },
        { status: 500 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await authClient.auth.getUser(accessToken);
    const authUser = data?.user;
    const userEmail = authUser?.email;

    if (error || !userEmail) {
      console.error('Google auth token validation failed:', error);
      return NextResponse.json({ error: 'Invalid Google session' }, { status: 401 });
    }

    const email = userEmail.toLowerCase().trim();
    const metadataName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
    const fallbackName = email.split('@')[0] || 'User';

    // db-wrapper uses service role (bypasses RLS)
    let user = await db.users.findByEmail(email);

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPassword);
      const defaultRole =
        (process.env.GOOGLE_DEFAULT_ROLE as 'employee' | 'contractor' | 'admin') || 'employee';

      user = await db.users.create({
        email,
        name: String(metadataName || fallbackName),
        password: passwordHash,
        role: ['employee', 'contractor', 'admin'].includes(defaultRole)
          ? defaultRole
          : 'employee',
      });
    }

    const token = generateToken(user);

    try {
      const serverDb = getServerSupabase();
      await serverDb.from('timesheet_user_logins').insert({
        user_id: user.id,
        email: user.email,
        ip_address:
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          req.headers.get('x-real-ip') ||
          'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });
    } catch (logError) {
      console.error('Failed to log Google login:', logError);
    }

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    const message = error instanceof Error ? error.message : 'Google sign-in failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

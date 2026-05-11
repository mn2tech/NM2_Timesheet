import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db-wrapper';
import { generateToken, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Google access token is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase is not configured on server' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    const authUser = data?.user;
    const userEmail = authUser?.email;
    if (error || !userEmail) {
      return NextResponse.json({ error: 'Invalid Google session' }, { status: 401 });
    }

    const email = userEmail.toLowerCase().trim();
    const metadataName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
    const fallbackName = email.split('@')[0] || 'User';

    let user = await db.users.findByEmail(email);
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPassword);
      const defaultRole = (process.env.GOOGLE_DEFAULT_ROLE as 'employee' | 'contractor' | 'admin') || 'employee';

      user = await db.users.create({
        email,
        name: String(metadataName || fallbackName),
        password: passwordHash,
        role: ['employee', 'contractor', 'admin'].includes(defaultRole) ? defaultRole : 'employee',
      });
    }

    const token = generateToken(user);
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
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Google sign-in failed' }, { status: 500 });
  }
}

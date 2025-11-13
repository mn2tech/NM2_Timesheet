import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-wrapper';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, adminCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (role && !['employee', 'contractor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Admin registration requires a special code
    if (role === 'admin') {
      const ADMIN_SECRET = process.env.ADMIN_SECRET || 'NM2TECH-ADMIN-2024';
      if (adminCode !== ADMIN_SECRET) {
        return NextResponse.json(
          { error: 'Invalid admin code' },
          { status: 403 }
        );
      }
    }

    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await db.users.create({
      email,
      name,
      password: hashedPassword,
      role: role || 'employee',
    });

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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


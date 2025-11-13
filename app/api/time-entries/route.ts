import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { db } from '@/lib/db-wrapper';

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const entries = await db.timeEntries.findByUserId(decoded.userId);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Get entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { date, hours, project, description } = await req.json();

    if (!date || !hours || !project) {
      return NextResponse.json(
        { error: 'Date, hours, and project are required' },
        { status: 400 }
      );
    }

    if (hours <= 0 || hours > 24) {
      return NextResponse.json(
        { error: 'Hours must be between 0 and 24' },
        { status: 400 }
      );
    }

    const entry = await db.timeEntries.create({
      userId: decoded.userId,
      date,
      hours: parseFloat(hours),
      project,
      description: description || '',
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Create entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


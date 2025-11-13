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

    const user = await db.users.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const entries = await db.timeEntries.getAll();
    const users = await db.users.getAll();
    
    // Enrich entries with user information
    const enrichedEntries = entries.map(entry => {
      const entryUser = users.find(u => u.id === entry.userId);
      return {
        ...entry,
        userName: entryUser?.name || 'Unknown',
        userEmail: entryUser?.email || 'Unknown',
        userRole: entryUser?.role || 'Unknown',
      };
    });

    return NextResponse.json({ entries: enrichedEntries });
  } catch (error) {
    console.error('Get all entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


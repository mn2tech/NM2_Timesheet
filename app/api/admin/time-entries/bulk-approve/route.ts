import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db-wrapper';

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

    // Check if user is admin
    const user = await db.users.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { entryIds } = await req.json();

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { error: 'entryIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const entryId of entryIds) {
      try {
        const entry = await db.timeEntries.findById(entryId);
        
        if (!entry) {
          errors.push({ entryId, error: 'Entry not found' });
          continue;
        }

        const currentStatus = entry.status || 'draft';
        if (currentStatus !== 'submitted') {
          errors.push({ entryId, error: `Entry is ${currentStatus}, not submitted` });
          continue;
        }

        const updated = await db.timeEntries.update(entryId, { status: 'approved' });
        
        if (!updated) {
          errors.push({ entryId, error: 'Failed to update entry' });
          continue;
        }

        results.push(updated);
      } catch (error) {
        console.error(`Error approving entry ${entryId}:`, error);
        errors.push({ entryId, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      message: `Approved ${results.length} of ${entryIds.length} entries`,
      approved: results.length,
      total: entryIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve entries', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



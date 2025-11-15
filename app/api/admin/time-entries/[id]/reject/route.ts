import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { db } from '@/lib/db-wrapper';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const admin = await db.users.findById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const entry = await db.timeEntries.findById(params.id);
    if (!entry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    // Update status to 'rejected' (user can then edit and resubmit)
    const updated = await db.timeEntries.update(params.id, { status: 'rejected' });
    
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 });
    }
    
    console.log('Time entry rejected:', params.id, 'New status:', updated.status);
    return NextResponse.json({ entry: updated, message: 'Time entry rejected' });
  } catch (error) {
    console.error('Reject time entry error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}


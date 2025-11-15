import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { db } from '@/lib/db-wrapper';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    console.log('PUT request for entry ID:', params.id, 'Type:', typeof params.id);
    
    const entry = await db.timeEntries.findById(params.id);
    if (!entry) {
      console.error('Entry not found for ID:', params.id);
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    console.log('Found entry:', { id: entry.id, date: entry.date, status: entry.status, userId: entry.userId });

    // Check if user is admin
    const user = await db.users.findById(decoded.userId);
    const isAdmin = user?.role === 'admin';

    // Non-admins can only edit their own entries
    if (!isAdmin && entry.userId !== decoded.userId) {
      console.error('User ID mismatch:', { entryUserId: entry.userId, decodedUserId: decoded.userId });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Prevent editing approved entries (they are finalized)
    // Allow editing submitted entries - they will revert to draft status
    // Admins can edit approved entries
    if (entry.status === 'approved' && !isAdmin) {
      console.log('Cannot edit entry with status:', entry.status);
      return NextResponse.json(
        { error: 'Cannot edit approved entries. Please contact an admin.' },
        { status: 400 }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { date, hours, project, description } = requestBody;
    
    const updates: any = {};

    if (date) updates.date = date;
    
    // Handle hours - explicitly allow 0
    if (hours !== undefined && hours !== null && hours !== '') {
      const hoursNum = typeof hours === 'number' ? hours : parseFloat(String(hours));
      
      if (isNaN(hoursNum)) {
        return NextResponse.json(
          { error: 'Hours must be a valid number' },
          { status: 400 }
        );
      }
      
      if (hoursNum < 0 || hoursNum > 24) {
        return NextResponse.json(
          { error: 'Hours must be between 0 and 24' },
          { status: 400 }
        );
      }
      
      // Always set hours, including 0
      updates.hours = hoursNum;
    }
    
    if (project) updates.project = project;
    if (description !== undefined) updates.description = description;

    // Ensure we have at least one field to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    try {
      // Verify entry exists before attempting update
      const entryBeforeUpdate = await db.timeEntries.findById(params.id);
      if (!entryBeforeUpdate) {
        return NextResponse.json(
          { error: 'Entry not found. It may have been deleted.' },
          { status: 404 }
        );
      }
      
      // If entry is rejected or submitted and being edited by non-admin, reset status to 'draft' so user can resubmit
      // This allows users to fix rejected/submitted entries and resubmit them
      // Admins can edit without changing status (they maintain control over status)
      if (!isAdmin && (entryBeforeUpdate.status === 'rejected' || entryBeforeUpdate.status === 'submitted')) {
        updates.status = 'draft';
        console.log(`Resetting ${entryBeforeUpdate.status} entry ${params.id} to draft status for resubmission`);
      }
      
      const updated = await db.timeEntries.update(params.id, updates);
      
      if (!updated) {
        console.error('Update returned null for entry:', params.id, 'Updates:', updates);
        return NextResponse.json(
          { error: 'Failed to update entry. The update operation returned no result.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ entry: updated });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      console.error('Error details:', {
        id: params.id,
        updates,
        errorMessage: dbError instanceof Error ? dbError.message : String(dbError),
        errorStack: dbError instanceof Error ? dbError.stack : undefined
      });
      // Return a more specific error
      const dbErrorMessage = dbError instanceof Error ? dbError.message : 'Database error';
      return NextResponse.json(
        { 
          error: 'Failed to update entry',
          message: `Database error: ${dbErrorMessage}`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Update entry error:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Extract a meaningful error message
    let errorMessage = 'Failed to update entry';
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('Database write failed')) {
        errorMessage = 'Failed to save to database. Please check file permissions.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Entry not found. It may have been deleted.';
      } else {
        errorMessage = error.message || 'Failed to update entry';
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update entry',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const entry = await db.timeEntries.findById(params.id);
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    if (entry.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await db.timeEntries.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


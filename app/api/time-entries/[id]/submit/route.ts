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
      console.error('Entry not found for ID:', params.id);
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    console.log('Found entry:', { id: entry.id, date: entry.date, status: entry.status, userId: entry.userId });

    if (entry.userId !== decoded.userId) {
      console.error('User ID mismatch:', { entryUserId: entry.userId, decodedUserId: decoded.userId });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Allow submitting draft or rejected entries (rejected entries can be edited and resubmitted)
    const currentStatus = entry.status || 'draft';
    if (currentStatus !== 'draft' && currentStatus !== 'rejected') {
      console.log('Entry already has status:', currentStatus, 'Cannot submit');
      return NextResponse.json(
        { error: `Entry is already ${currentStatus}. Cannot submit.` },
        { status: 400 }
      );
    }

    // Update status to 'submitted'
    console.log('Attempting to update entry:', params.id, 'Current status:', entry.status || 'draft');
    console.log('Entry ID type:', typeof params.id, 'Entry ID value:', params.id);
    console.log('Entry object ID:', typeof entry.id, 'Entry ID value:', entry.id);
    console.log('IDs match?', params.id === entry.id, 'String comparison:', String(params.id) === String(entry.id));
    
    try {
      // Verify entry exists before update
      const entryBeforeUpdate = await db.timeEntries.findById(params.id);
      if (!entryBeforeUpdate) {
        console.error('Entry not found before update attempt:', params.id);
        return NextResponse.json(
          { error: 'Entry not found' },
          { status: 404 }
        );
      }
      
      console.log('Calling db.timeEntries.update with:', { id: params.id, updates: { status: 'submitted' } });
      const updated = await db.timeEntries.update(params.id, { status: 'submitted' });
      
      console.log('Update result:', updated ? 'SUCCESS' : 'FAILED (returned null)');
      console.log('Updated entry:', updated ? JSON.stringify(updated, null, 2) : 'null');
    
      if (!updated) {
        console.error('Update returned null for entry:', params.id);
        console.error('Entry before update:', JSON.stringify(entry, null, 2));
        // Try to find the entry again to see if it still exists
        const entryAfter = await db.timeEntries.findById(params.id);
        console.error('Entry after failed update:', entryAfter ? JSON.stringify(entryAfter, null, 2) : 'Entry not found');
        
        // Check if we're using Supabase or JSON
        const useSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        console.error('Database type:', useSupabase ? 'Supabase' : 'JSON file');
        
        return NextResponse.json(
          { error: 'Failed to update entry status. The entry may have been deleted or the update operation failed.' },
          { status: 500 }
        );
      }
      
      console.log('Entry submitted successfully:', params.id, 'New status:', updated.status);
      return NextResponse.json({ entry: updated, message: 'Entry submitted for approval' });
    } catch (updateError) {
      console.error('Error during update operation:', updateError);
      console.error('Error type:', updateError instanceof Error ? updateError.constructor.name : typeof updateError);
      console.error('Error message:', updateError instanceof Error ? updateError.message : String(updateError));
      console.error('Error stack:', updateError instanceof Error ? updateError.stack : 'No stack trace');
      throw updateError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Submit entry error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}`, details: process.env.NODE_ENV === 'development' ? errorDetails : undefined },
      { status: 500 }
    );
  }
}


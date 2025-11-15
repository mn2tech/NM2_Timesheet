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

    // Allow 0 hours, so check for undefined/null/empty string, not falsy
    if (!date || (hours === undefined || hours === null || hours === '') || !project) {
      return NextResponse.json(
        { error: 'Date, hours, and project are required' },
        { status: 400 }
      );
    }

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

    try {
      const entry = await db.timeEntries.create({
        userId: decoded.userId,
        date,
        hours: hoursNum, // Use the parsed number (can be 0)
        project,
        description: description || '',
      });

      return NextResponse.json({ entry }, { status: 201 });
    } catch (createError) {
      console.error('Database create error:', createError);
      console.error('Create params:', { userId: decoded.userId, date, hours: hoursNum, project, description });
      throw createError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Create entry error:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Extract meaningful error message
    let errorMessage = 'Failed to create entry';
    if (error instanceof Error) {
      if (error.message.includes('Database write failed')) {
        errorMessage = 'Failed to save to database. Please check file permissions.';
      } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
        errorMessage = 'An entry for this date already exists.';
      } else {
        errorMessage = error.message || 'Failed to create entry';
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create entry',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}


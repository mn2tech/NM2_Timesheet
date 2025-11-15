import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-wrapper';
import jwt from 'jsonwebtoken';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
// Get basePath from next.config.js (defaults to empty for local dev)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.users.findByEmail(email);
    
    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          type: 'password-reset',
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Create reset link (include basePath if set)
      const resetLink = `${BASE_URL}${BASE_PATH}/reset-password?token=${resetToken}`;

      // Send email with reset link
      const emailOptions = generatePasswordResetEmail(resetLink, user.name);
      emailOptions.to = user.email;
      
      try {
        await sendEmail(emailOptions);
      } catch (emailError) {
        // Log error but don't fail the request (security: don't reveal if email failed)
        console.error('Failed to send password reset email:', emailError);
        // In development, still log the link
        if (process.env.NODE_ENV === 'development') {
          console.log('\n📧 Password Reset Link (development):', resetLink);
          console.log('User:', user.email);
          console.log('Token expires in 1 hour\n');
        }
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success to prevent information leakage
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }
}


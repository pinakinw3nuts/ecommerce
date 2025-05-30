import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



// Validation schema for password reset request
const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Validation schema for password reset
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = resetRequestSchema.parse(body);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // TODO: Save reset token and expiry to user record in database
    // TODO: Send reset email with token

    return NextResponse.json({ 
      message: 'If an account exists with this email, a password reset link will be sent.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // TODO: Verify token is valid and not expired
    // TODO: Update user's password in database
    // TODO: Invalidate token

    return NextResponse.json({ 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
} 
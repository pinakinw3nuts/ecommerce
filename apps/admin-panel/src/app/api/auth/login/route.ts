import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Call admin-specific login endpoint
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Authentication failed' },
        { status: response.status }
      );
    }

    // Create the response
    const res = NextResponse.json({
      token: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    });

    // Set the token in an HTTP-only cookie
    cookies().set('admin_token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes (match token expiration)
      path: '/',
    });

    // Store refresh token in a separate cookie with longer expiration
    cookies().set('admin_refresh_token', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
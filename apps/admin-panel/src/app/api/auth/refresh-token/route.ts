import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schema
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = refreshTokenSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { refreshToken } = validationResult.data;

    // Call refresh token endpoint
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to refresh token' },
        { status: response.status }
      );
    }

    // Create the response
    const res = NextResponse.json({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    });

    // Set the new access token in an HTTP-only cookie
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
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
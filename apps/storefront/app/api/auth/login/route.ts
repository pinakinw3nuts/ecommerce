import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { API_GATEWAY_URL, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';

// Define login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    // Extract credentials
    const { email, password } = validationResult.data;

    // Call auth service through API gateway
    const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify({ email, password }),
    });

    // Parse response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      return NextResponse.json(
        { 
          message: result.message || 'Authentication failed',
          status: 'error' 
        }, 
        { status: response.status }
      );
    }

    // Create a response object
    const nextResponse = NextResponse.json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      // Include tokens in the response for client-side storage as backup
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      status: 'success',
    });

    // Set access token as HTTP-only cookie
    nextResponse.cookies.set({
      name: ACCESS_TOKEN_NAME,
      value: result.accessToken,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Increase expiration to 30 minutes
      maxAge: 60 * 30,
    });
    
    // Set refresh token as HTTP-only cookie
    nextResponse.cookies.set({
      name: REFRESH_TOKEN_NAME,
      value: result.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Longer expiration (e.g., 7 days)
      maxAge: 60 * 60 * 24 * 7,
    });

    // Add cache control headers
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    nextResponse.headers.set('Pragma', 'no-cache');
    nextResponse.headers.set('Expires', '0');

    // Also set non-httpOnly cookies for client-side access (for debugging)
    nextResponse.headers.append('Set-Cookie', `${ACCESS_TOKEN_NAME}_client=${result.accessToken}; Path=/; Max-Age=${60 * 30}; SameSite=Lax`);
    nextResponse.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}_client=${result.refreshToken}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);

    return nextResponse;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error' 
      }, 
      { status: 500 }
    );
  }
} 
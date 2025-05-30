import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';



const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001';

export async function POST() {
  try {
    // Get the refresh token from the HTTP-only cookie
    const refreshToken = cookies().get('admin_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'No refresh token found' },
        { status: 401 }
      );
    }

    // Set up timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Call refresh token endpoint
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // If refresh token is invalid or expired, clear cookies
        if (response.status === 401) {
          cookies().set('admin_token', '', {
            httpOnly: true,
            maxAge: 0,
            path: '/',
          });
          cookies().set('admin_refresh_token', '', {
            httpOnly: true,
            maxAge: 0,
            path: '/',
          });
        }

        return NextResponse.json(
          { message: data.message || 'Failed to refresh token' },
          { status: response.status }
        );
      }

      // Create the response
      const res = NextResponse.json({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
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
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        return NextResponse.json(
          { message: 'Request timed out. Please try again.' },
          { status: 408 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
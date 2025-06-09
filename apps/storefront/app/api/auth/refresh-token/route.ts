import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URL, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // Try to get refresh token from request body first
    let refreshToken;
    
    try {
      const body = await request.json();
      refreshToken = body.refreshToken;
    } catch (e) {
      // If parsing body fails, continue with cookie
    }
    
    // If no token in body, try to get from cookies
    if (!refreshToken) {
      refreshToken = request.cookies.get(REFRESH_TOKEN_NAME)?.value;
    }

    // If no refresh token in body or cookies, return unauthorized
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'No refresh token provided' }, 
        { status: 401 }
      );
    }

    // Call auth service through API gateway
    const response = await fetch(`${API_GATEWAY_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify({ refreshToken }),
    });

    // Parse response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      // Clear cookies if refresh failed
      const errorResponse = NextResponse.json(
        { 
          message: result.message || 'Failed to refresh token',
          status: 'error' 
        }, 
        { status: response.status }
      );
      
      errorResponse.cookies.delete(ACCESS_TOKEN_NAME);
      errorResponse.cookies.delete(REFRESH_TOKEN_NAME);
      
      // Also delete client-side cookies
      errorResponse.headers.append('Set-Cookie', `${ACCESS_TOKEN_NAME}_client=; Path=/; Max-Age=0; SameSite=Lax`);
      errorResponse.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}_client=; Path=/; Max-Age=0; SameSite=Lax`);
      
      return errorResponse;
    }

    // Create a response object
    const nextResponse = NextResponse.json({
      message: 'Token refreshed successfully',
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
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error' 
      }, 
      { status: 500 }
    );
  }
} 
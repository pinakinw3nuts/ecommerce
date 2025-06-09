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
    
    // If no token in body, try to get from cookies (both HTTP-only and client)
    if (!refreshToken) {
      refreshToken = request.cookies.get(REFRESH_TOKEN_NAME)?.value || 
                    request.cookies.get(`${REFRESH_TOKEN_NAME}_client`)?.value;
    }

    // If no refresh token in body or cookies, return unauthorized
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'No refresh token provided' }, 
        { status: 401 }
      );
    }

    console.log('Refreshing token with:', { refreshTokenExists: !!refreshToken });

    // Call auth service through API gateway with explicit timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      // Always use IPv4 address explicitly for local development
      const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:3000'
        : API_GATEWAY_URL.endsWith('/api')
          ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
          : API_GATEWAY_URL;
      
      console.log('Making refresh token request to:', `${baseUrl}/api/auth/refresh-token`);
      
      const response = await fetch(`${baseUrl}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Parse response
      const result = await response.json();

      // Handle error response
      if (!response.ok) {
        console.error('Refresh token failed:', result);
        
        // Clear cookies if refresh failed
        const errorResponse = NextResponse.json(
          { 
            message: result.message || 'Failed to refresh token',
            status: 'error' 
          }, 
          { status: response.status }
        );
        
        // Clear all cookie variations
        errorResponse.cookies.delete(ACCESS_TOKEN_NAME);
        errorResponse.cookies.delete(REFRESH_TOKEN_NAME);
        
        // Also delete client-side cookies
        errorResponse.headers.append('Set-Cookie', `${ACCESS_TOKEN_NAME}_client=; Path=/; Max-Age=0; SameSite=Lax`);
        errorResponse.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}_client=; Path=/; Max-Age=0; SameSite=Lax`);
        
        return errorResponse;
      }

      console.log('Token refresh successful, setting new cookies');

      // Create a response object
      const nextResponse = NextResponse.json({
        message: 'Token refreshed successfully',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        status: 'success',
      });

      // Set access token with JavaScript access enabled
      nextResponse.cookies.set({
        name: ACCESS_TOKEN_NAME,
        value: result.accessToken,
        httpOnly: false, // Allow JavaScript access
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
        httpOnly: true, // Prevent JavaScript access for security
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
      
      // Also set explicit client-side cookies for JavaScript access
      nextResponse.headers.append('Set-Cookie', `${ACCESS_TOKEN_NAME}_client=${result.accessToken}; Path=/; Max-Age=${60 * 30}; SameSite=Lax`);
      nextResponse.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}_client=${result.refreshToken}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);

      return nextResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Fetch error in refresh token:', error);
      
      // If it's an AbortError, return timeout error
      if (error instanceof DOMException && error.name === 'AbortError') {
        return NextResponse.json(
          { message: 'Request timed out. Please try again.' },
          { status: 408 }
        );
      }
      
      throw error;
    }
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
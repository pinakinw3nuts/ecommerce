import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URL, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get(REFRESH_TOKEN_NAME)?.value;

    // Create response object
    const response = NextResponse.json({
      message: 'Logged out successfully',
      status: 'success',
    });

    // Delete cookies
    response.cookies.delete(ACCESS_TOKEN_NAME);
    response.cookies.delete(REFRESH_TOKEN_NAME);
    
    // Also delete client-side cookies
    response.headers.append('Set-Cookie', `${ACCESS_TOKEN_NAME}_client=; Path=/; Max-Age=0; SameSite=Lax`);
    response.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}_client=; Path=/; Max-Age=0; SameSite=Lax`);

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // If we have a refresh token, call the auth service to invalidate it
    if (refreshToken) {
      try {
        await fetch(`${API_GATEWAY_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        // Log error but continue with logout
        console.error('Error calling logout endpoint:', error);
      }
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, ensure cookies are deleted
    const errorResponse = NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error' 
      }, 
      { status: 500 }
    );
    
    // Delete cookies
    errorResponse.cookies.delete(ACCESS_TOKEN_NAME);
    errorResponse.cookies.delete(REFRESH_TOKEN_NAME);
    
    // Also delete client-side cookies
    errorResponse.headers.append('Set-Cookie', `${ACCESS_TOKEN_NAME}_client=; Path=/; Max-Age=0; SameSite=Lax`);
    errorResponse.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}_client=; Path=/; Max-Age=0; SameSite=Lax`);
    
    return errorResponse;
  }
} 
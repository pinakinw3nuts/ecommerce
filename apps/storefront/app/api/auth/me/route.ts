import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, getRefreshToken } from '@/lib/auth';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = getAccessToken(request);
    const refreshToken = getRefreshToken(request);

    // If no token at all, return unauthorized
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // If we have an access token, create a mock user
    // In a real implementation, this would validate the token and fetch user data
    if (accessToken) {
      // Try to decode the token to get user info
      let userId = 'authenticated-user';
      let name = 'Authenticated User';
      let email = 'user@example.com';
      
      try {
        // Try to decode the token to get user info
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.userId || payload.sub || userId;
          name = payload.name || name;
          email = payload.email || email;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
      
      // Return mock user data
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          name: name,
          email: email
        }
      });
    }

    // If we only have a refresh token, return unauthorized
    return NextResponse.json(
      { message: 'Unauthorized' }, 
      { status: 401 }
    );
  } catch (error) {
    console.error('Error in ME route:', error);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';

// API Gateway URL - use explicit IPv4 address
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000/api';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // If there's a refresh token, invalidate it on the server
    if (refreshToken) {
      await fetch(`${API_GATEWAY_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(error => {
        // Log error but continue with local logout
        console.error('Error invalidating refresh token:', error);
      });
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logged out successfully',
      status: 'success',
    });

    // Clear cookies
    response.cookies.set({
      name: 'accessToken',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    response.cookies.set({
      name: 'refreshToken',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error' 
      }, 
      { status: 500 }
    );
  }
} 
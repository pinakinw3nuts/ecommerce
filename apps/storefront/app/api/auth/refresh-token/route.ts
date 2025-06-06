import { NextRequest, NextResponse } from 'next/server';

// API Gateway URL - use explicit IPv4 address
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000/api';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // If no refresh token, return unauthorized
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
      },
      body: JSON.stringify({ refreshToken }),
    });

    // Parse response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      return NextResponse.json(
        { 
          message: result.message || 'Failed to refresh token',
          status: 'error' 
        }, 
        { status: response.status }
      );
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
      name: 'accessToken',
      value: result.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      // Short expiration (e.g., 15 minutes)
      maxAge: 60 * 15,
    });
    
    // Set refresh token as HTTP-only cookie
    nextResponse.cookies.set({
      name: 'refreshToken',
      value: result.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      // Longer expiration (e.g., 7 days)
      maxAge: 60 * 60 * 24 * 7,
    });

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
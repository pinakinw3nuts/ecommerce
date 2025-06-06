import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@lib/auth';

// API Gateway URL - use explicit IPv4 address
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000/api';

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = getAccessToken(request);

    // If no token, return unauthorized
    if (!accessToken) {
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Call auth service through API gateway
    const response = await fetch(`${API_GATEWAY_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // If unauthorized, return 401
    if (response.status === 401) {
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || 'Failed to fetch user profile' }, 
        { status: response.status }
      );
    }

    // Return user data
    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 
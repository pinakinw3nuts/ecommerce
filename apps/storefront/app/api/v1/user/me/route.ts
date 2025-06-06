import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Use localhost with IPv4 instead of IPv6 (::1)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000/api';

// Define token name directly to avoid client-side imports
const ACCESS_TOKEN_NAME = 'access_token';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    const cookie = request.headers.get('cookie') || '';
    
    // Get token from cookies directly
    const token = request.cookies.get(ACCESS_TOKEN_NAME)?.value;
    
    console.log('[API] User/me called');
    console.log('[API] Auth header exists:', !!authHeader);
    console.log('[API] Cookie header exists:', !!cookie);
    console.log('[API] Token from cookies exists:', !!token);
    
    // If no auth header or cookie, return unauthorized
    if (!authHeader && !cookie && !token) {
      console.log('[API] No authentication data found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Prepare headers for the API request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Forward the request to the API gateway
    console.log('[API] Forwarding request to API gateway');
    const response = await fetch(`${API_BASE_URL}/v1/user/me`, {
      headers,
      credentials: 'include',
    });

    console.log('[API] Response status:', response.status);
    
    if (!response.ok) {
      console.log('[API] Failed to fetch user profile');
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] User data retrieved successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    const cookie = request.headers.get('cookie') || '';
    const token = request.cookies.get(ACCESS_TOKEN_NAME)?.value;
    
    // If no auth header or cookie, return unauthorized
    if (!authHeader && !cookie && !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Prepare headers for the API request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Forward the request to the API gateway
    const response = await fetch(`${API_BASE_URL}/v1/user/me`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 
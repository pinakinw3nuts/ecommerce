import { NextRequest, NextResponse } from 'next/server';

// API Gateway URL - use explicit IPv4 address
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000/api';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { token } = body;

    // Validate token
    if (!token) {
      return NextResponse.json(
        { 
          message: 'Token is required', 
          status: 'error' 
        }, 
        { status: 400 }
      );
    }

    // Call auth service through API gateway to validate token
    const response = await fetch(`${API_GATEWAY_URL}/auth/validate-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    // Parse response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      return NextResponse.json(
        { 
          message: result.message || 'Invalid or expired token',
          status: 'error',
          valid: false
        }, 
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Token is valid',
      status: 'success',
      valid: true
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error',
        valid: false
      }, 
      { status: 500 }
    );
  }
} 
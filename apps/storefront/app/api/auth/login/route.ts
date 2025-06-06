import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Define login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// API Gateway URL - use explicit IPv4 address
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000/api';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    // Extract credentials
    const { email, password } = validationResult.data;

    // Call auth service through API gateway
    const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Parse response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      return NextResponse.json(
        { 
          message: result.message || 'Authentication failed',
          status: 'error' 
        }, 
        { status: response.status }
      );
    }

    // Create a response object
    const nextResponse = NextResponse.json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
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
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error' 
      }, 
      { status: 500 }
    );
  }
} 
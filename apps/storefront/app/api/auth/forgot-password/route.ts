import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define schema for forgot password request
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// API Gateway URL - use explicit IPv4 address
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000/api';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    // Extract email
    const { email } = validationResult.data;

    // Call auth service through API gateway
    const response = await fetch(`${API_GATEWAY_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Parse response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      return NextResponse.json(
        { 
          message: result.message || 'Password reset request failed',
          status: 'error' 
        }, 
        { status: response.status }
      );
    }

    // Return success response - we always return success even if email doesn't exist
    // to prevent email enumeration attacks
    return NextResponse.json({
      message: 'If your email exists in our system, you will receive password reset instructions',
      status: 'success',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error' 
      }, 
      { status: 500 }
    );
  }
} 
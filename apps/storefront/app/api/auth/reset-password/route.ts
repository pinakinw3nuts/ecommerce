import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define reset password schema
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// API Gateway URL - use explicit IPv4 address
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000/api';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    // Extract data
    const { token, password } = validationResult.data;

    // Call auth service through API gateway
    const response = await fetch(`${API_GATEWAY_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    // Parse response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      return NextResponse.json(
        { 
          message: result.message || 'Password reset failed',
          status: 'error' 
        }, 
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Password has been reset successfully',
      status: 'success',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error' 
      }, 
      { status: 500 }
    );
  }
} 
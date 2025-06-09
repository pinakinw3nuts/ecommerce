import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { API_GATEWAY_URL } from '@/lib/constants';

// Define signup schema
const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    // Extract user data
    const { name, email, password } = validationResult.data;

    // Call auth service through API gateway
    const response = await fetch(`${API_GATEWAY_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    // Parse response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      return NextResponse.json(
        { 
          message: result.message || 'Registration failed',
          status: 'error' 
        }, 
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Registration successful',
      status: 'success',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        status: 'error' 
      }, 
      { status: 500 }
    );
  }
} 
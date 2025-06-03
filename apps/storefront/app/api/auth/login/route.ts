import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return new NextResponse('Email and password are required', { status: 400 });
    }
    
    // In a real implementation, this would:
    // 1. Validate the user credentials against a database
    // 2. Generate a JWT token
    // 3. Return the token to the client
    
    // Mock successful login for demo purposes
    if (body.email === 'user@example.com' && body.password === 'password') {
      return NextResponse.json({
        accessToken: 'mock_jwt_token',
        user: {
          id: 'user_123',
          name: 'John Doe',
          email: 'user@example.com'
        }
      });
    }
    
    // Return error for invalid credentials
    return new NextResponse('Invalid credentials', { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return new NextResponse('Login failed', { status: 500 });
  }
} 
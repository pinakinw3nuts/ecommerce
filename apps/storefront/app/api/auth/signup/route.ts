import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return new NextResponse('Name, email, and password are required', { status: 400 });
    }
    
    // In a real implementation, this would:
    // 1. Check if the email is already in use
    // 2. Hash the password
    // 3. Create a new user in the database
    // 4. Generate a JWT token
    // 5. Return the token to the client
    
    // Mock successful signup for demo purposes
    return NextResponse.json({
      accessToken: 'mock_jwt_token',
      user: {
        id: 'user_' + Date.now(),
        name: body.name,
        email: body.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return new NextResponse('Signup failed', { status: 500 });
  }
} 
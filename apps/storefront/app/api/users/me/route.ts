import { NextRequest, NextResponse } from 'next/server';

// Mock user data
const mockUser = {
  id: "user_123",
  name: "John Doe",
  email: "john.doe@example.com"
};

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token
    
    // Return the mock user data
    return NextResponse.json(mockUser);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse('Failed to fetch user profile', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In a real implementation, we would verify the JWT token
    
    // Parse the request body
    const body = await req.json();
    
    if (!body.name || !body.email) {
      return new NextResponse('Name and email are required', { status: 400 });
    }
    
    // In a real implementation, we would update the user data in a database
    // For now, just return success
    
    // Update the mock user (this won't persist between requests)
    Object.assign(mockUser, {
      name: body.name,
      email: body.email
    });
    
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse('Failed to update user profile', { status: 500 });
  }
} 
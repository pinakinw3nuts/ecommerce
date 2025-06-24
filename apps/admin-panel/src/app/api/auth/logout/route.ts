import { NextResponse } from 'next/server';
import { clearAuthCookies } from '../../../../lib/auth-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear auth cookies
    clearAuthCookies(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Failed to logout' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Clear the auth cookie
  cookies().delete('admin_token');

  return NextResponse.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
} 
import { NextRequest, NextResponse } from 'next/server';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback` 
  : 'http://localhost:3100/api/auth/google/callback';

// Generate a random state for CSRF protection
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET(request: NextRequest) {
  try {
    // Generate state for CSRF protection
    const state = generateState();
    
    // Store state in cookie for verification in callback
    const response = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${state}`
    );
    
    // Set state in cookie for verification
    response.cookies.set({
      name: 'google_oauth_state',
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect('/login?error=oauth_error');
  }
} 
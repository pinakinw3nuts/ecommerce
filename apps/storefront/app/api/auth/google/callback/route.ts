import { NextRequest, NextResponse } from 'next/server';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback` 
  : 'http://localhost:3100/api/auth/google/callback';

// API Gateway URL - use explicit IPv4 address
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000/api';

export async function GET(request: NextRequest) {
  try {
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect('/login?error=google_oauth_error');
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing code or state parameter');
      return NextResponse.redirect('/login?error=invalid_request');
    }

    // Verify state parameter against cookie to prevent CSRF
    const storedState = request.cookies.get('google_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('State mismatch, possible CSRF attack');
      return NextResponse.redirect('/login?error=invalid_state');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect('/login?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const { id_token } = tokenData;

    // Call auth service through API gateway for Google login
    const authResponse = await fetch(`${API_GATEWAY_URL}/auth/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: id_token }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      console.error('Auth service error:', errorData);
      return NextResponse.redirect('/login?error=authentication_failed');
    }

    const authResult = await authResponse.json();

    // Create a response that redirects to home page
    const response = NextResponse.redirect(new URL('/', request.url));

    // Set cookies for authentication
    response.cookies.set({
      name: 'accessToken',
      value: authResult.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });

    response.cookies.set({
      name: 'refreshToken',
      value: authResult.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear the state cookie
    response.cookies.set({
      name: 'google_oauth_state',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect('/login?error=server_error');
  }
} 
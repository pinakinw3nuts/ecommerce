import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setAuthCookies } from '../../../../lib/auth-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Configure service URL, default to direct service connection if gateway not available
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://127.0.0.1:3000';
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://127.0.0.1:3001';

// Use API gateway when available, fallback to direct service connection
const AUTH_ENDPOINT = `${API_GATEWAY_URL}/api/auth/admin/login`;
const DIRECT_AUTH_ENDPOINT = `${AUTH_SERVICE_URL}/api/auth/admin/login`;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Set up timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Try API gateway first, if it fails, we'll try direct connection in the catch block
      let response;
      try {
        // Call admin-specific login endpoint through API gateway
        response = await fetch(AUTH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password
          }),
          signal: controller.signal,
          cache: 'no-store' // Ensure we don't use cached responses
        });
      } catch (gatewayError) {
        console.log('API Gateway connection failed, trying direct service connection');
        // Fallback to direct service connection
        response = await fetch(DIRECT_AUTH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password
          }),
          signal: controller.signal,
          cache: 'no-store' // Ensure we don't use cached responses
        });
      }

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || 'Authentication failed' },
          { status: response.status }
        );
      }

      // Create the response
      const res = NextResponse.json({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user
      });

      // Set the auth cookies
      setAuthCookies(res, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      });

      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        return NextResponse.json(
          { message: 'Login request timed out. Please try again.' },
          { status: 408 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
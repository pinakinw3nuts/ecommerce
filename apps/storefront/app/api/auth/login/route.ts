import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { API_GATEWAY_URL, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';

// Define login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Define error interface for better typing
interface FetchError extends Error {
  cause?: {
    code?: string;
    address?: string;
    port?: number;
    errno?: number;
    syscall?: string;
  };
}

/**
 * POST handler for /api/auth/login
 * Proxies requests to the API gateway
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    // Extract credentials
    const { email, password } = validationResult.data;

    // Always use IPv4 address explicitly for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000' // Force IPv4 explicitly
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
    
    console.log('Making API request to:', `${baseUrl}/api/auth/login`);

    // Call auth service through API gateway with explicit timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Parse response
      const result = await response.json();

      // Handle error response
      if (!response.ok) {
        return NextResponse.json(
          { 
            message: result.message || 'Authentication failed',
            status: 'error' 
          }, 
          { status: response.status }
        );
      }

      // Standardize user data format
      const userData = {
        id: result.user?.id || 'authenticated-user',
        name: result.user?.name || 'User',
        email: result.user?.email || email,
      };

      // Create a response object
      const nextResponse = NextResponse.json({
        message: 'Login successful',
        user: userData,
        // Include tokens in the response for client-side storage as backup
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        status: 'success',
      });

      // Set access token as cookie (not httpOnly to allow JS access)
      nextResponse.cookies.set({
        name: ACCESS_TOKEN_NAME,
        value: result.accessToken,
        httpOnly: false, // Allow JavaScript access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // 30 minutes expiration
        maxAge: 60 * 30,
      });
      
      // Set refresh token as HTTP-only cookie for security
      nextResponse.cookies.set({
        name: REFRESH_TOKEN_NAME,
        value: result.refreshToken,
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // Longer expiration (e.g., 7 days)
        maxAge: 60 * 60 * 24 * 7,
      });

      // Add both tokens as client-accessible cookies as well
      nextResponse.headers.append('Set-Cookie', `${ACCESS_TOKEN_NAME}_client=${result.accessToken}; Path=/; Max-Age=${60 * 30}; SameSite=Lax`);
      nextResponse.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}_client=${result.refreshToken}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);

      // Add cache control headers
      nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      nextResponse.headers.set('Pragma', 'no-cache');
      nextResponse.headers.set('Expires', '0');

      console.log('Login successful, setting cookies:', {
        accessToken: ACCESS_TOKEN_NAME,
        refreshToken: REFRESH_TOKEN_NAME
      });

      return nextResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const fetchError = error as FetchError;
      console.error('Fetch error details:', { 
        message: fetchError.message,
        cause: fetchError.cause,
        code: fetchError.cause?.code,
        address: fetchError.cause?.address,
        port: fetchError.cause?.port
      });
      
      // Just rethrow the error - no mock fallback
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { 
        error: 'Failed to login', 
        message: error.message, 
        details: {
          code: error.cause?.code,
          address: error.cause?.address,
          port: error.cause?.port
        }
      },
      { status: error.response?.status || 500 }
    );
  }
} 
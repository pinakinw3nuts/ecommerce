import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { API_GATEWAY_URL, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';

// Define register schema with password confirmation
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
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
 * POST handler for /api/auth/register
 * Proxies requests to the API gateway
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    // Extract user data (exclude confirmPassword)
    const { name, email, password } = validationResult.data;

    // Always use IPv4 address explicitly for local development
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3000' // Force IPv4 explicitly
      : API_GATEWAY_URL.endsWith('/api')
        ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
        : API_GATEWAY_URL;
    
    console.log('Making API request to:', `${baseUrl}/api/auth/signup`);
    
    // Call auth service through API gateway with explicit timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      // Call auth service through API gateway
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ name, email, password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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

      // Create a response object with tokens
      const nextResponse = NextResponse.json({
        message: 'Registration successful',
        status: 'success',
        user: {
          id: result.user?.id,
          name: result.user?.name || name,
          email: result.user?.email || email,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }, { status: 201 });

      // Set access token as HTTP-only cookie
      if (result.accessToken) {
        nextResponse.cookies.set({
          name: ACCESS_TOKEN_NAME,
          value: result.accessToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 30, // 30 minutes
        });
      }
      
      // Set refresh token as HTTP-only cookie
      if (result.refreshToken) {
        nextResponse.cookies.set({
          name: REFRESH_TOKEN_NAME,
          value: result.refreshToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }

      // Add cache control headers
      nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      nextResponse.headers.set('Pragma', 'no-cache');
      nextResponse.headers.set('Expires', '0');

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
    console.error('Registration error:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { 
        error: 'Failed to register', 
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
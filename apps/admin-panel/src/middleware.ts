import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/unauthorized',
  '/api/auth/login',
  '/api/auth/refresh-token',
  '/api/auth/logout',
  '/api/test',
];

export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests for API routes
  if (request.nextUrl.pathname.startsWith('/api') && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Store current URL in cookies for redirects after login
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);

  // Get the path from URL
  const { pathname } = new URL(request.url);
  
  // Skip auth check for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set('next-url', request.url);

    // Add CORS headers for API routes
    if (pathname.startsWith('/api')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    return response;
  }

  // Skip auth check for static assets
  if (pathname.includes('/_next') || pathname.includes('/favicon.ico')) {
    return NextResponse.next();
  }

  // Get the access token from cookies
  const accessToken = request.cookies.get('admin_token');
  
  // If no access token, redirect to login with return URL
  if (!accessToken) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('returnUrl', pathname);
    
    return NextResponse.redirect(redirectUrl);
  }

  // Continue with the request for authenticated paths
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Store the current URL in cookies for reference
  response.cookies.set('next-url', request.url);
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return response;
}

// Configure which paths the middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 
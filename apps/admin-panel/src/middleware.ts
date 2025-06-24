import { NextRequest, NextResponse } from 'next/server';

// List of protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/orders',
  '/products',
  '/categories',
  '/users',
  '/settings',
];

// List of API routes that need token forwarding
const API_ROUTES = [
  '/api/orders',
  '/api/products',
  '/api/categories',
  '/api/users',
  '/api/settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip non-protected routes and non-API routes
  if (!PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && 
      !API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check for admin token in cookies
  const adminToken = request.cookies.get('admin_token');
  
  // For UI routes, redirect to login if no token is found
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && !adminToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // For API routes, add token to request headers
  if (API_ROUTES.some(route => pathname.startsWith(route)) && adminToken) {
    // Clone the request headers
    const requestHeaders = new Headers(request.headers);
    
    // Add admin token to the request headers
    requestHeaders.set('X-Admin-Token', adminToken.value);
    
    // Return the modified request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Continue for all other routes
  return NextResponse.next();
}

// Configure middleware to run only for specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}; 
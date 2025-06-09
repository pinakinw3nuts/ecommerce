import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/products',
  '/categories',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/refresh-token',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/validate-reset-token',
];

// Check if the path is public
const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith('/products/') || 
    path.startsWith('/categories/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/api/products') ||
    path.startsWith('/api/categories')
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths and static assets
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Skip middleware if we're already on the login page with a redirect parameter
  // This prevents redirect loops
  if (pathname === '/login' && request.nextUrl.searchParams.has('redirect')) {
    return NextResponse.next();
  }

  // Get access token from cookies
  const accessToken = request.cookies.get(ACCESS_TOKEN_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_NAME)?.value;

  // If there's no access token but there is a refresh token, try to refresh
  if (!accessToken && refreshToken) {
    try {
      console.log('Middleware: Attempting to refresh token');
      // Call refresh token endpoint
      const response = await fetch(`${request.nextUrl.origin}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        console.log('Middleware: Token refresh successful');
        const data = await response.json();
        
        // Create response with redirected request
        const res = NextResponse.next();
        
        // Set new tokens in cookies
        res.cookies.set(ACCESS_TOKEN_NAME, data.accessToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 60, // 30 minutes
          path: '/',
        });
        
        res.cookies.set(REFRESH_TOKEN_NAME, data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        });
        
        return res;
      } else {
        console.log('Middleware: Token refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing token in middleware:', error);
    }
  }

  // If no access token and no refresh token or refresh failed, redirect to login for protected routes
  if (!accessToken && pathname.startsWith('/account')) {
    console.log('Middleware: No valid tokens, redirecting to login');
    // Create the redirect URL with the current path as the redirect parameter
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    '/((?!api/auth/login|api/auth/signup|api/auth/refresh-token|_next/static|_next/image|favicon.ico).*)',
  ],
}; 
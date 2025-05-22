import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Store the requested URL path in a cookie
  const response = NextResponse.next();
  response.cookies.set('next-url', request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}; 
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Get admin token from cookies
 */
export async function getAdminToken() {
  try {
    const cookiesList = await cookies();
    const adminToken = cookiesList.get('admin_token');
    return adminToken?.value;
  } catch (error) {
    console.error('Error getting admin token:', error);
    return null;
  }
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken() {
  try {
    const cookiesList = await cookies();
    const refreshToken = cookiesList.get('admin_refresh_token');
    return refreshToken?.value;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
}

/**
 * Set cookies in response
 */
export function setAuthCookies(
  response: NextResponse,
  { accessToken, refreshToken }: { accessToken: string; refreshToken: string }
) {
  // Set the new access token in an HTTP-only cookie
  response.cookies.set('admin_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, // 15 minutes (match token expiration)
    path: '/',
  });

  // Store refresh token in a separate cookie with longer expiration
  response.cookies.set('admin_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  
  response.cookies.set('admin_refresh_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });

  return response;
} 
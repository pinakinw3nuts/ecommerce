import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function getAuthToken(req: NextRequest): Promise<string | null> {
  // Try to get the token from the Authorization header first
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fallback to checking cookies
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('admin_token');
  return tokenCookie?.value || null;
} 
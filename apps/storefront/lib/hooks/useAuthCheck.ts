'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';

/**
 * Hook to check authentication status on app load
 * This runs before the page renders to ensure auth state is consistent
 */
export function useAuthCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Protected paths that require authentication
  const protectedPaths = ['/account', '/checkout', '/orders'];
  
  // Check if current path requires authentication
  const isProtectedPath = protectedPaths.some(path => 
    pathname?.startsWith(path)
  );
  
  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for non-protected paths
      if (!isProtectedPath) {
        setIsChecking(false);
        return;
      }
      
      try {
        // Check for both HTTP-only and client-accessible cookies
        const accessToken = Cookies.get(ACCESS_TOKEN_NAME) || Cookies.get(`${ACCESS_TOKEN_NAME}_client`);
        const refreshToken = Cookies.get(REFRESH_TOKEN_NAME) || Cookies.get(`${REFRESH_TOKEN_NAME}_client`);
        
        console.log('Auth check - Protected path:', pathname);
        console.log('Auth check - Tokens found:', { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken 
        });
        
        // If no tokens at all, redirect to login
        if (!accessToken && !refreshToken) {
          console.log('No auth tokens found, redirecting to login');
          const redirectPath = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
          router.push(redirectPath);
          return;
        }
        
        // If no access token but have refresh token, try to refresh
        if (!accessToken && refreshToken) {
          console.log('No access token, attempting to refresh with refresh token');
          // Call refresh token endpoint
          const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            // If refresh failed, redirect to login
            console.log('Token refresh failed, redirecting to login');
            Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
            Cookies.remove(REFRESH_TOKEN_NAME, { path: '/' });
            Cookies.remove(`${ACCESS_TOKEN_NAME}_client`, { path: '/' });
            Cookies.remove(`${REFRESH_TOKEN_NAME}_client`, { path: '/' });
            const redirectPath = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
            router.push(redirectPath);
            return;
          }
          
          // Refresh successful, also set client-side cookies
          const refreshData = await response.json();
          if (refreshData.accessToken) {
            Cookies.set(`${ACCESS_TOKEN_NAME}_client`, refreshData.accessToken, {
              path: '/',
              expires: 1/48, // 30 minutes
              sameSite: 'lax'
            });
          }
          
          if (refreshData.refreshToken) {
            Cookies.set(`${REFRESH_TOKEN_NAME}_client`, refreshData.refreshToken, {
              path: '/',
              expires: 7, // 7 days
              sameSite: 'lax'
            });
          }
          
          console.log('Token refresh successful');
        }
        
        // If we have an access token, verify it's valid
        if (accessToken) {
          try {
            console.log('Verifying access token validity');
            const meResponse = await fetch('/api/auth/me', {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
              credentials: 'include'
            });
            
            if (!meResponse.ok && meResponse.status !== 404) {
              console.log('Token verification failed, status:', meResponse.status);
              // If verification failed (not a 404) and we don't have a refresh token, redirect to login
              if (!refreshToken) {
                Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
                Cookies.remove(`${ACCESS_TOKEN_NAME}_client`, { path: '/' });
                const redirectPath = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
                router.push(redirectPath);
                return;
              }
            } else {
              console.log('Access token verified successfully');
            }
          } catch (error) {
            // If there's an error but we have a token, assume authenticated
            console.error('Error verifying token:', error);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [isProtectedPath, pathname, router]);
  
  return { isChecking };
} 
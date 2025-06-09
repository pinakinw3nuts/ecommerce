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
        const accessToken = Cookies.get(ACCESS_TOKEN_NAME);
        const refreshToken = Cookies.get(REFRESH_TOKEN_NAME);
        
        // If no tokens at all, redirect to login
        if (!accessToken && !refreshToken) {
          router.push(`/login?redirect=${encodeURIComponent(pathname || '')}`);
          return;
        }
        
        // If no access token but have refresh token, try to refresh
        if (!accessToken && refreshToken) {
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
            Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
            Cookies.remove(REFRESH_TOKEN_NAME, { path: '/' });
            router.push(`/login?redirect=${encodeURIComponent(pathname || '')}`);
            return;
          }
          
          // Refresh successful, continue
        }
        
        // If we have an access token, verify it's valid
        if (accessToken) {
          try {
            const meResponse = await fetch('/api/auth/me', {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
              credentials: 'include'
            });
            
            if (!meResponse.ok && meResponse.status !== 404) {
              // If verification failed (not a 404) and we don't have a refresh token, redirect to login
              if (!refreshToken) {
                Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
                router.push(`/login?redirect=${encodeURIComponent(pathname || '')}`);
                return;
              }
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
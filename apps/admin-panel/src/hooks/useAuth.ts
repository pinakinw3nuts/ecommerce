'use client';

import { useEffect, useState } from 'react';
import { refreshAccessToken, getDecodedToken, isTokenExpired, logoutAdmin } from '@/lib/auth';

interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  userId: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    userId: null,
    isLoading: true,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get decoded token from memory cache or null if not available/expired
        const decodedToken = getDecodedToken();

        // If we have a valid token in memory
        if (decodedToken) {
          setAuthState({
            isAuthenticated: true,
            role: decodedToken.role,
            userId: decodedToken.userId,
            isLoading: false,
          });
          return;
        }

        // If token is expired or not available, try to refresh
        try {
          const refreshSuccessful = await refreshAccessToken();
          
          if (refreshSuccessful) {
            // Get the newly refreshed token
            const newToken = getDecodedToken();
            
            if (newToken) {
              setAuthState({
                isAuthenticated: true,
                role: newToken.role,
                userId: newToken.userId,
                isLoading: false,
              });
              return;
            }
          }
          
          // If refresh failed or no new token available
          setAuthState({
            isAuthenticated: false,
            role: null,
            userId: null,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error refreshing token:', error);
          setAuthState({
            isAuthenticated: false,
            role: null,
            userId: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          isAuthenticated: false,
          role: null,
          userId: null,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  // Logout function
  const logout = async () => {
    await logoutAdmin();
    setAuthState({
      isAuthenticated: false,
      role: null,
      userId: null,
      isLoading: false,
    });
  };

  // Function to refresh token manually if needed
  const refresh = async (): Promise<boolean> => {
    try {
      const refreshSuccessful = await refreshAccessToken();
      
      if (refreshSuccessful) {
        const newToken = getDecodedToken();
        
        if (newToken) {
          setAuthState({
            isAuthenticated: true,
            role: newToken.role,
            userId: newToken.userId,
            isLoading: false,
          });
          return true;
        }
      }
      
      // If refresh failed or no new token available
      logout();
      return false;
    } catch (error) {
      console.error('Manual refresh error:', error);
      logout();
      return false;
    }
  };

  return {
    ...authState,
    logout,
    refresh,
  };
} 
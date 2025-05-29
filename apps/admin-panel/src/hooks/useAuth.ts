'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import { refreshAccessToken, getToken, getRefreshToken, clearTokens, isTokenExpired } from '@/lib/auth';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  userId: string | null;
  isLoading: boolean;
}

const TOKEN_COOKIE_NAME = 'admin_token';
const REFRESH_TOKEN_COOKIE_NAME = 'admin_refresh_token';

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
        const token = getToken();
        const refreshToken = getRefreshToken();

        // If no tokens at all, user is not authenticated
        if (!token && !refreshToken) {
          setAuthState({
            isAuthenticated: false,
            role: null,
            userId: null,
            isLoading: false,
          });
          return;
        }

        // Check if access token is valid
        if (token) {
          try {
            const decoded = jwtDecode<DecodedToken>(token);
            const currentTime = Date.now() / 1000;

            // If token is still valid, set auth state
            if (decoded.exp > currentTime) {
              setAuthState({
                isAuthenticated: true,
                role: decoded.role,
                userId: decoded.userId,
                isLoading: false,
              });
              return;
            }
          } catch (error) {
            console.error('Error decoding token:', error);
          }
        }

        // If we got here, access token is expired or invalid
        // Try to refresh if we have a refresh token
        if (refreshToken) {
          try {
            const { accessToken } = await refreshAccessToken();
            const decoded = jwtDecode<DecodedToken>(accessToken);
            
            setAuthState({
              isAuthenticated: true,
              role: decoded.role,
              userId: decoded.userId,
              isLoading: false,
            });
          } catch (error) {
            console.error('Error refreshing token:', error);
            // Clear all tokens if refresh fails
            clearTokens();
            setAuthState({
              isAuthenticated: false,
              role: null,
              userId: null,
              isLoading: false,
            });
          }
        } else {
          // No refresh token, clear state
          clearTokens();
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
  const logout = () => {
    clearTokens();
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
      const { accessToken } = await refreshAccessToken();
      const decoded = jwtDecode<DecodedToken>(accessToken);
      
      setAuthState({
        isAuthenticated: true,
        role: decoded.role,
        userId: decoded.userId,
        isLoading: false,
      });
      return true;
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
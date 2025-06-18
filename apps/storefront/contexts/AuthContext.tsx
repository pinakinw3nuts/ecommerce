'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  clearAuthTokens,
} from '@/lib/authTokens';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';
import api from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';

// Define user type
export interface User {
  id: string;
  name: string | null;
  email: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<boolean>;
  error: string | null;
  refreshAuth: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Get redirect URL from window.location.search on mount
  const [redirectUrl, setRedirectPath] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      if (redirect) {
        setRedirectPath(redirect);
      }
    }
  }, []);

  // Function to create a standard user object from token or default values
  const createStandardUser = useCallback((accessToken: string | undefined) => {
    let userId = '';
    let name = 'User';
    let email = 'user@example.com';

    // Regex to validate UUID format
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
    if (accessToken) {
      try {
        // Try to decode the token to get user info
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const decodedUserId = payload.userId || payload.sub;
          if (decodedUserId && isUUID(decodedUserId)) {
            userId = decodedUserId;
          } else {
            userId = uuidv4();
          }
          name = payload.name || name;
          email = payload.email || email;
        }
      } catch (error) {
        userId = uuidv4();
      }
    } else {
      // If no access token, this is likely a guest user or unauthenticated state. Generate a UUID.
      userId = uuidv4();
    }

    return {
      id: userId,
      name: name,
      email: email
    };
  }, []);

  // Function to refresh authentication
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      // Check for both HTTP-only and client-accessible cookies
      const refreshToken = getRefreshToken() || getAccessToken();
      
      if (!refreshToken) {
        return false;
      }
      
      // Call refresh token endpoint
      const refreshResponse = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include'
      });
      
      if (!refreshResponse.ok) {
        // Clear cookies if refresh failed
        removeAccessToken();
        removeRefreshToken();
        return false;
      }
      
      const refreshData = await refreshResponse.json();
      
      // Ensure client-side cookies are set as backup
      if (refreshData.accessToken) {
        setAccessToken(refreshData.accessToken);
      }
      
      if (refreshData.refreshToken) {
        setRefreshToken(refreshData.refreshToken);
      }
      
      // Get user data
      const meResponse = await fetch('/api/auth/me', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        credentials: 'include'
      });
      
      if (!meResponse.ok) {
        if (refreshData.accessToken) {
          // Use token data if available
          setUser(createStandardUser(refreshData.accessToken));
          return true;
        }
        return false;
      }
      
      const userData = await meResponse.json();
      setUser(userData.user);
      return true;
    } catch (error) {
      return false;
    }
  }, [createStandardUser]);

  // Check auth status function
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check for access token - try both httpOnly and client cookies
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      
      // If no tokens, user is not authenticated
      if (!accessToken && !refreshToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Try to get user data with current token
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Continue to token refresh if this fails
      }
      
      // If user data request failed, try to refresh the token
      const refreshSuccess = await refreshAuth();
      
      if (!refreshSuccess) {
        setUser(null);
      }
      
      setIsLoading(false);
    } catch (error) {
      setUser(null);
      setIsLoading(false);
    }
  }, [refreshAuth]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Set client-side cookies as backup
      if (data.accessToken) {
        setAccessToken(data.accessToken);
      }
      
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      
      // Get user data
      await checkAuthStatus();
      
      // Handle redirect
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (pathname === '/login' || pathname === '/signup') {
        window.location.href = '/account';
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthStatus, pathname, redirectUrl]);

  // Logout function
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear cookies
      removeAccessToken();
      removeRefreshToken();
      
      // Clear user state
      setUser(null);
      
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Determine if user is authenticated
  const isAuthenticated = !!user;

  // Create context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    error,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
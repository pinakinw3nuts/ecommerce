'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';
import api from '@/lib/api';

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
  logout: () => Promise<void>;
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
  const searchParams = useSearchParams();

  // Function to refresh authentication
  const refreshAuth = async (): Promise<boolean> => {
    try {
      // Get refresh token
      const refreshToken = Cookies.get(REFRESH_TOKEN_NAME);
      
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
        Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
        Cookies.remove(REFRESH_TOKEN_NAME, { path: '/' });
        return false;
      }
      
      // Get user data
      const meResponse = await fetch('/api/auth/me', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        credentials: 'include'
      });
      
      if (!meResponse.ok) {
        return false;
      }
      
      const userData = await meResponse.json();
      setUser(userData.user);
      return true;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      return false;
    }
  };

  // Function to create a standard user object from token or default values
  const createStandardUser = (accessToken: string | undefined) => {
    let userId = 'authenticated-user';
    let name = 'User';
    let email = 'user@example.com';
    
    if (accessToken) {
      try {
        // Try to decode the token to get user info
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.userId || payload.sub || userId;
          name = payload.name || name;
          email = payload.email || email;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    return {
      id: userId,
      name: name,
      email: email
    };
  };

  // Check if user is logged in on mount and when tokens change
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check for access token
        const accessToken = Cookies.get(ACCESS_TOKEN_NAME);
        const refreshToken = Cookies.get(REFRESH_TOKEN_NAME);
        
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
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsLoading(false);
            return;
          }
          
          // If we get a 404, the route might not be available
          // In this case, we'll create a mock user based on the token
          if (response.status === 404 && accessToken) {
            setUser(createStandardUser(accessToken));
            setIsLoading(false);
            return;
          }
          
          // If unauthorized and we have a refresh token, try to refresh
          if ((response.status === 401 || response.status === 403) && refreshToken) {
            const success = await refreshAuth();
            if (!success) {
              setUser(null);
            } else {
              // After successful refresh, try to get user data again
              const meResponse = await fetch('/api/auth/me', {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                },
                credentials: 'include'
              });
              
              if (meResponse.ok) {
                const userData = await meResponse.json();
                setUser(userData.user);
              } else if (meResponse.status === 404 && accessToken) {
                // If we get a 404 again, create a mock user
                setUser(createStandardUser(accessToken));
              } else {
                setUser(null);
              }
            }
          } else {
            // Not authenticated and no refresh token or refresh failed
            setUser(null);
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          
          // If there's an error but we have a token, assume authenticated
          if (accessToken) {
            setUser(createStandardUser(accessToken));
            setIsLoading(false);
            return;
          }
          
          // Try to refresh token if available
          if (refreshToken) {
            const success = await refreshAuth();
            if (!success) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
    
    // Setup interval to periodically check auth status
    const intervalId = setInterval(checkAuthStatus, 4 * 60 * 1000); // Check every 4 minutes (before the 5-minute token expiry)
    
    return () => clearInterval(intervalId);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Update user state
      setUser(data.user);
      
      // Wait a moment to ensure cookies are set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if there's a redirect parameter
      const redirect = searchParams.get('redirect');
      
      console.log('Login successful, redirecting to:', redirect || '/account');
      
      // Use router.replace instead of push to avoid adding to history
      if (redirect) {
        router.replace(redirect);
      } else {
        router.replace('/account');
      }
      
      router.refresh(); // Refresh the page to update server components
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        credentials: 'include'
      });

      // Clear user state regardless of response
      setUser(null);
      
      // Clear cookies manually to ensure they're removed
      Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
      Cookies.remove(REFRESH_TOKEN_NAME, { path: '/' });
      
      router.refresh(); // Refresh the page to update server components
      router.push('/'); // Redirect to home page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
      console.error('Logout error:', err);
      
      // Still clear user state and cookies on error
      setUser(null);
      Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
      Cookies.remove(REFRESH_TOKEN_NAME, { path: '/' });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    error,
    refreshAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
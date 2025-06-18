'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
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
  // Remove direct useSearchParams call and replace with client-side approach
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  // Get redirect URL from window.location.search on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      if (redirect) {
        setRedirectUrl(redirect);
      }
    }
  }, []);

  // Function to refresh authentication
  const refreshAuth = async (): Promise<boolean> => {
    try {
      // Check for both HTTP-only and client-accessible cookies
      const refreshToken = Cookies.get(REFRESH_TOKEN_NAME) || Cookies.get(`${REFRESH_TOKEN_NAME}_client`);
      
      if (!refreshToken) {
        console.log('No refresh token found in cookies');
        return false;
      }
      
      console.log('Attempting to refresh token...');
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
        Cookies.remove(`${ACCESS_TOKEN_NAME}_client`, { path: '/' });
        Cookies.remove(`${REFRESH_TOKEN_NAME}_client`, { path: '/' });
        console.log('Token refresh failed, cleared cookies.');
        return false;
      }
      
      const refreshData = await refreshResponse.json();
      console.log('Token refresh successful. New access token received.');
      
      // Ensure client-side cookies are set as backup
      if (refreshData.accessToken) {
        Cookies.set(`${ACCESS_TOKEN_NAME}_client`, refreshData.accessToken, {
          path: '/',
          expires: 1/48, // 30 minutes
          sameSite: 'lax'
        });
        
        // Also set a redundant cookie with non-standard name that won't be overwritten
        // This is a backup in case the other cookie gets cleared
        Cookies.set(`auth_backup_token`, refreshData.accessToken, {
          path: '/',
          expires: 1/24, // 1 hour
          sameSite: 'lax'
        });
      }
      
      if (refreshData.refreshToken) {
        Cookies.set(`${REFRESH_TOKEN_NAME}_client`, refreshData.refreshToken, {
          path: '/',
          expires: 7, // 7 days
          sameSite: 'lax'
        });
        
        // Backup refresh token with different name
        Cookies.set(`auth_backup_refresh`, refreshData.refreshToken, {
          path: '/',
          expires: 7, // 7 days
          sameSite: 'lax'
        });
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
      console.error('Error refreshing auth:', error);
      return false;
    }
  };

  // Function to create a standard user object from token or default values
  const createStandardUser = (accessToken: string | undefined) => {
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
            console.warn('Decoded userId from token is not a valid UUID or is missing. Generating a new one for this session.');
            userId = uuidv4();
          }
          name = payload.name || name;
          email = payload.email || email;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
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
  };

  // Check if user is logged in on mount and when tokens change
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check for access token - try both httpOnly and client cookies
        const accessToken = Cookies.get(ACCESS_TOKEN_NAME) || 
                           Cookies.get(`${ACCESS_TOKEN_NAME}_client`) ||
                           Cookies.get('auth_backup_token');
                           
        const refreshToken = Cookies.get(REFRESH_TOKEN_NAME) || 
                            Cookies.get(`${REFRESH_TOKEN_NAME}_client`) ||
                            Cookies.get('auth_backup_refresh');
        
        console.log('Auth check - Initial tokens:', { 
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
        });
        
        // If we have backup tokens but not primary tokens, restore them
        if ((!Cookies.get(ACCESS_TOKEN_NAME) && !Cookies.get(`${ACCESS_TOKEN_NAME}_client`)) && 
            Cookies.get('auth_backup_token')) {
          console.log('Restoring from backup token');
          Cookies.set(`${ACCESS_TOKEN_NAME}_client`, Cookies.get('auth_backup_token') || '', {
            path: '/',
            expires: 1/48, // 30 minutes
            sameSite: 'lax'
          });
        }
        
        if ((!Cookies.get(REFRESH_TOKEN_NAME) && !Cookies.get(`${REFRESH_TOKEN_NAME}_client`)) && 
            Cookies.get('auth_backup_refresh')) {
          console.log('Restoring from backup refresh token');
          Cookies.set(`${REFRESH_TOKEN_NAME}_client`, Cookies.get('auth_backup_refresh') || '', {
            path: '/',
            expires: 7, // 7 days
            sameSite: 'lax'
          });
        }
        
        // If no tokens, user is not authenticated
        if (!accessToken && !refreshToken) {
          console.log('Auth check - No tokens found, setting user to null.');
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
            console.log('Auth check - User data fetched successfully:', data.user);
            setUser(data.user);
            setIsLoading(false);
            return;
          }
          
          // If we get a 404, the route might not be available
          // In this case, we'll create a mock user based on the token
          if (response.status === 404 && accessToken) {
            console.log('Auth check - /api/auth/me returned 404, creating standard user from token.');
            setUser(createStandardUser(accessToken));
            setIsLoading(false);
            return;
          }
          
          // If unauthorized and we have a refresh token, try to refresh
          if ((response.status === 401 || response.status === 403) && refreshToken) {
            console.log('Auth check - Token unauthorized, attempting refresh...');
            const success = await refreshAuth();
            if (!success) {
              console.log('Auth check - Token refresh failed, setting user to null.');
              setUser(null);
            } else {
              console.log('Auth check - Token refreshed successfully, re-fetching user data.');
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
                console.log('Auth check - User data re-fetched after refresh:', userData.user);
                setUser(userData.user);
              } else if (meResponse.status === 404 && accessToken) {
                // If we get a 404 again, create a mock user
                console.log('Auth check - /api/auth/me returned 404 after refresh, creating standard user.');
                setUser(createStandardUser(accessToken));
              } else {
                console.log('Auth check - Failed to re-fetch user data after refresh, setting user to null.');
                setUser(null);
              }
            }
          } else {
            // Not authenticated and no refresh token or refresh failed
            console.log('Auth check - Not authenticated and no refresh token or refresh failed, setting user to null.');
            setUser(null);
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          
          // If there's an error but we have a token, assume authenticated
          if (accessToken) {
            console.log('Auth check - Error occurred, but access token present. Creating standard user from token.');
            setUser(createStandardUser(accessToken));
            setIsLoading(false);
            return;
          }
          
          // Try to refresh token if available
          if (refreshToken) {
            console.log('Auth check - Error occurred, attempting refresh from error block...');
            const success = await refreshAuth();
            if (!success) {
              console.log('Auth check - Refresh from error block failed, setting user to null.');
              setUser(null);
            }
          } else {
            console.log('Auth check - No access token or refresh token after error, setting user to null.');
            setUser(null);
          }
        } finally {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
      }
    };

    checkAuthStatus();
    
    // Setup interval to periodically check auth status
    const intervalId = setInterval(checkAuthStatus, 4 * 60 * 1000); // Check every 4 minutes (before the 5-minute token expiry)
    
    return () => clearInterval(intervalId);
  }, []);

  // Derived state for isAuthenticated
  const isAuthenticated = !!user && !isLoading;

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
      
      // Manually set cookies on the client side as a backup
      if (data.accessToken) {
        Cookies.set(`${ACCESS_TOKEN_NAME}_client`, data.accessToken, {
          path: '/',
          expires: 1/48, // 30 minutes
          sameSite: 'lax'
        });
        
        // Also set the regular cookie for compatibility
        Cookies.set(ACCESS_TOKEN_NAME, data.accessToken, {
          path: '/',
          expires: 1/48, // 30 minutes
          sameSite: 'lax'
        });
      }
      
      if (data.refreshToken) {
        Cookies.set(`${REFRESH_TOKEN_NAME}_client`, data.refreshToken, {
          path: '/',
          expires: 7, // 7 days
          sameSite: 'lax'
        });
      }
      
      // Wait longer to ensure cookies are set before navigation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if there's a redirect parameter
      const redirect = redirectUrl || '/account';
      
      console.log('Login successful, redirecting to:', redirect);
      console.log('Cookies after login:', {
        accessToken: Cookies.get(ACCESS_TOKEN_NAME) || Cookies.get(`${ACCESS_TOKEN_NAME}_client`),
        refreshToken: !!Cookies.get(REFRESH_TOKEN_NAME) || !!Cookies.get(`${REFRESH_TOKEN_NAME}_client`)
      });
      
      // Use router.replace instead of push to avoid adding to history
      router.replace(redirect);
      
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
      Cookies.remove(`${ACCESS_TOKEN_NAME}_client`, { path: '/' });
      Cookies.remove(`${REFRESH_TOKEN_NAME}_client`, { path: '/' });
      
      router.refresh(); // Refresh the page to update server components
      router.push('/'); // Redirect to home page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
      console.error('Logout error:', err);
      
      // Still clear user state and cookies on error
      setUser(null);
      Cookies.remove(ACCESS_TOKEN_NAME, { path: '/' });
      Cookies.remove(REFRESH_TOKEN_NAME, { path: '/' });
      Cookies.remove(`${ACCESS_TOKEN_NAME}_client`, { path: '/' });
      Cookies.remove(`${REFRESH_TOKEN_NAME}_client`, { path: '/' });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
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
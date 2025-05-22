'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

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

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    userId: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);

    if (!token) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        // Token has expired
        Cookies.remove(TOKEN_COOKIE_NAME);
        setAuthState({
          isAuthenticated: false,
          role: null,
          userId: null,
          isLoading: false,
        });
        return;
      }

      setAuthState({
        isAuthenticated: true,
        role: decoded.role,
        userId: decoded.userId,
        isLoading: false,
      });
    } catch (error) {
      // Invalid token
      console.error('Error decoding token:', error);
      Cookies.remove(TOKEN_COOKIE_NAME);
      setAuthState({
        isAuthenticated: false,
        role: null,
        userId: null,
        isLoading: false,
      });
    }
  }, []);

  const logout = () => {
    Cookies.remove(TOKEN_COOKIE_NAME);
    setAuthState({
      isAuthenticated: false,
      role: null,
      userId: null,
      isLoading: false,
    });
  };

  return {
    ...authState,
    logout,
  };
} 
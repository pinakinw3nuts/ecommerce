'use client';

import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'admin_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

/**
 * Set the JWT token in a cookie
 */
export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, { 
    expires: 1/96, // 15 minutes
    secure: window.location.protocol === 'https:',
    sameSite: 'strict',
  });
}

/**
 * Set the refresh token in a cookie
 */
export function setRefreshToken(token: string): void {
  Cookies.set(REFRESH_TOKEN_KEY, token, { 
    expires: 7, // 7 days
    secure: window.location.protocol === 'https:',
    sameSite: 'strict',
  });
}

/**
 * Get the JWT token from the cookie
 */
export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

/**
 * Get the refresh token from the cookie
 */
export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

/**
 * Clear both tokens from cookies
 */
export function clearTokens(): void {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}

export function getDecodedToken(): DecodedToken | null {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

/**
 * Check if the token is expired
 */
export function isTokenExpired(): boolean {
  const decoded = getDecodedToken();
  if (!decoded) return true;
  
  // Add a 30-second buffer to handle timing issues
  const currentTime = Date.now() / 1000 + 30;
  return decoded.exp < currentTime;
}

/**
 * Check if token is about to expire (within 2 minutes)
 */
export function isTokenExpiringSoon(): boolean {
  const decoded = getDecodedToken();
  if (!decoded) return true;
  
  const currentTime = Date.now() / 1000;
  const timeLeft = decoded.exp - currentTime;
  
  // Return true if less than 2 minutes left
  return timeLeft < 120;
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await fetch('/api/auth/refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to refresh token');
  }

  const data = await response.json();
  
  if (!data.accessToken || !data.refreshToken) {
    throw new Error('Invalid response from server');
  }

  // Update cookies with new tokens
  setToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken
  };
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Authentication failed');
  }

  const data = await response.json();
  
  if (!data.token) {
    throw new Error('No token received from server');
  }

  // Set both tokens in cookies
  setToken(data.token);
  
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  
  return data;
}

export async function logoutAdmin() {
  clearTokens();
  // Force reload to clear any cached state
  window.location.href = '/login';
} 
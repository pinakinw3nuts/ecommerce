'use client';

import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

// We'll use a memory cache for the decoded token to avoid parsing it repeatedly
let cachedDecodedToken: DecodedToken | null = null;
let cachedTokenString: string | null = null;

/**
 * Get the decoded token from the memory cache or parse it from the API response
 */
export function getDecodedToken(): DecodedToken | null {
  // If we have a cached token, return it
  if (cachedDecodedToken) {
    // Check if it's expired
    const currentTime = Date.now() / 1000 + 30;
    if (cachedDecodedToken.exp > currentTime) {
      return cachedDecodedToken;
    }
    // Clear the cache if expired
    cachedDecodedToken = null;
    cachedTokenString = null;
  }
  
  return null;
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
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    if (!data.accessToken) {
      return false;
    }

    // Update the cached token
    try {
      cachedDecodedToken = jwtDecode<DecodedToken>(data.accessToken);
      cachedTokenString = data.accessToken;
    } catch {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Authentication failed');
  }

  const data = await response.json();
  
  if (!data.token) {
    throw new Error('No token received from server');
  }

  // Cache the decoded token
  try {
    cachedDecodedToken = jwtDecode<DecodedToken>(data.token);
    cachedTokenString = data.token;
  } catch (e) {
    console.error('Failed to decode token:', e);
  }
  
  return data;
}

export async function logoutAdmin() {
  // Clear the cached token
  cachedDecodedToken = null;
  cachedTokenString = null;
  
  // Call logout API to clear HTTP-only cookies
  await fetch('/api/auth/logout', {
    method: 'POST',
    cache: 'no-store'
  });
  
  // Force reload to clear any cached state
  window.location.href = '/login';
} 
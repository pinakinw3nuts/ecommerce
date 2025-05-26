'use client';

import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'admin_token';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

export function setToken(token: string) {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7, // Token expires in 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function removeToken() {
  Cookies.remove(TOKEN_KEY);
}

export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime && decoded.role === 'ADMIN';
  } catch {
    return false;
  }
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

  setToken(data.token);
  return data;
}

export async function logoutAdmin() {
  removeToken();
  // Force reload to clear any cached state
  window.location.href = '/login';
} 
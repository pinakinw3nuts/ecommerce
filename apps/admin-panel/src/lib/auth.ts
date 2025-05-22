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
  Cookies.set(TOKEN_KEY, token, { expires: 7 }); // Token expires in 7 days
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
    return decoded.exp > currentTime;
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
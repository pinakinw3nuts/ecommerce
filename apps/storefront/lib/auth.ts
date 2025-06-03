'use client';

import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';

export function getToken() {
  return Cookies.get('access_token') || null;
}

export function logout() {
  Cookies.remove('access_token');
  window.location.href = '/login';
}

export function decodeToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.decode(token) as { userId: string; role: string };
  } catch {
    return null;
  }
} 
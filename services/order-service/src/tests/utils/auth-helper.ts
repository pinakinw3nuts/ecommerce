import jwt from 'jsonwebtoken';
import { config } from '../../config/env';

interface TestTokenPayload {
  userId: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export function generateTestToken(userId: string, isAdmin: boolean = false): string {
  const payload: TestTokenPayload = {
    userId,
    isAdmin,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };

  return jwt.sign(payload, config.jwt.secret);
} 
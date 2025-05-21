import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from './logger';

/**
 * Decode and verify JWT token
 * @param token JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export async function decodeToken(token: string): Promise<any> {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    logger.error(error, 'Error decoding token');
    return null;
  }
} 
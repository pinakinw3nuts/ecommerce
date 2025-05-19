import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';

export function decodeToken<T>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}

export function generateToken(payload: object, expiresIn: string = '1h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions);
} 
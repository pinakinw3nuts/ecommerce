import { NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Validation schema (matching the client-side schema)
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Mock credentials
const MOCK_EMAIL = 'admin@example.com';
const MOCK_PASSWORD = 'admin123';
const JWT_SECRET = 'your-super-secret-jwt-key'; // In production, use environment variable

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check mock credentials
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      // Generate mock JWT token
      const token = jwt.sign(
        {
          userId: '1',
          email: MOCK_EMAIL,
          role: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return NextResponse.json({ token });
    }

    // Invalid credentials
    return NextResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { z } from 'zod';
import { UserRole, UserStatus } from '../entities';

// Base user schema
const userBase = {
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
};

// Schema for creating a new user
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  phone: z.string().optional(),
  preferences: z.object({
    newsletter: z.boolean(),
    marketing: z.boolean(),
    theme: z.enum(['light', 'dark']).optional(),
    language: z.string().optional()
  }).optional()
});

// Schema for updating a user
export const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  preferences: z.object({
    newsletter: z.boolean(),
    marketing: z.boolean(),
    theme: z.enum(['light', 'dark']).optional(),
    language: z.string().optional()
  }).optional()
});

// Schema for user queries
export const getUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.enum(['asc', 'desc']).default('asc'),
    email: z.string().email().optional(),
    name: z.string().optional(),
  }),
};

// Schema for getting a single user
export const getUserSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
};

// Export types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryParams = z.infer<typeof getUsersSchema.query>; 
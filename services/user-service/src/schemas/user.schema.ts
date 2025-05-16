import { z } from 'zod';

// Base user schema
const userBase = {
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
};

// Schema for creating a new user
export const createUserSchema = {
  body: z.object({
    ...userBase,
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      ),
  }),
};

// Schema for updating a user
export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    preferences: z.object({
      newsletter: z.boolean().optional(),
      marketing: z.boolean().optional(),
      theme: z.enum(['light', 'dark']).optional(),
      language: z.string().min(2).max(5).optional()
    }).optional()
  })
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
export type CreateUserInput = z.infer<typeof createUserSchema.body>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type UserQueryParams = z.infer<typeof getUsersSchema.query>; 
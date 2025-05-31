import { z } from 'zod';

/**
 * Common validation schemas for reuse across the application
 */

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid UUID format'
});

/**
 * Pagination query parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  order: z.enum(['ASC', 'DESC']).optional().default('DESC')
});

/**
 * Date range query parameters schema
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

/**
 * Product ID validation schema
 */
export const productSchema = z.object({
  productId: uuidSchema,
  variantId: z.string().optional()
});

/**
 * Metadata validation schema
 * Allows any JSON object with string keys and various value types
 */
export const metadataSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null()
  ])
).optional();

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  message: z.string(),
  error: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional()
}); 
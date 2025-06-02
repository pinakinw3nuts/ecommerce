import { z } from 'zod';

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid({ message: 'Must be a valid UUID' });

/**
 * Pagination parameters validation schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive({ message: 'Page must be a positive integer' })),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(
      z.number().int().min(1, { message: 'Limit must be at least 1' }).max(100, {
        message: 'Limit cannot exceed 100',
      })
    ),
});

/**
 * Slug validation schema
 */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  .min(1, { message: 'Slug cannot be empty' })
  .max(100, { message: 'Slug cannot exceed 100 characters' });

/**
 * Status validation schema
 */
export const statusSchema = z.enum(['draft', 'published', 'archived'], {
  errorMap: () => ({ message: 'Status must be one of: draft, published, archived' }),
});

/**
 * Schema for metadata objects
 */
export const metadataSchema = z
  .record(z.any())
  .optional()
  .default({});

/**
 * SEO data validation schema
 */
export const seoSchema = z.object({
  title: z.string().max(70, { message: 'SEO title should not exceed 70 characters' }).optional(),
  description: z
    .string()
    .max(160, { message: 'SEO description should not exceed 160 characters' })
    .optional(),
  keywords: z
    .array(z.string())
    .max(10, { message: 'Maximum 10 keywords allowed' })
    .optional(),
  ogImage: z.string().url({ message: 'Open Graph image must be a valid URL' }).optional(),
  canonical: z.string().url({ message: 'Canonical URL must be a valid URL' }).optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
});

/**
 * Date range validation schema
 */
export const dateRangeSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must be in YYYY-MM-DD format' })
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'End date must be in YYYY-MM-DD format' })
    .optional(),
});

/**
 * Sort parameters validation schema
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Content block validation schema
 * Base schema for various content block types
 */
export const contentBlockBaseSchema = z.object({
  id: z.string().uuid({ message: 'Block ID must be a valid UUID' }),
  type: z.string(),
  title: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  settings: z.record(z.any()).optional().default({}),
}); 
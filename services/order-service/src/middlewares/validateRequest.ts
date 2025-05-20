import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { logger } from '../utils/logger';

export interface ValidationConfig {
  params?: z.ZodType<any>;
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
}

/**
 * Format Zod validation errors into a user-friendly format
 */
const formatZodError = (error: z.ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Create a validation middleware using Zod schemas
 * @param schema Validation schema configuration
 */
export const validateRequest = (schema: ValidationConfig) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate URL parameters if schema provided
      if (schema.params) {
        request.params = schema.params.parse(request.params);
      }

      // Validate query parameters if schema provided
      if (schema.query) {
        request.query = schema.query.parse(request.query);
      }

      // Validate request body if schema provided
      if (schema.body) {
        request.body = schema.body.parse(request.body);
      }

    } catch (error) {
      logger.debug('Request validation failed:', error);

      if (error instanceof z.ZodError) {
        reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: formatZodError(error),
        });
        return;
      }

      // Handle unexpected errors
      reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
      });
      return;
    }
  };
};

/**
 * Example usage:
 * 
 * const createOrderSchema = {
 *   body: z.object({
 *     items: z.array(z.object({
 *       productId: z.string().uuid(),
 *       quantity: z.number().int().positive(),
 *     })),
 *     shippingAddress: z.object({
 *       street: z.string(),
 *       city: z.string(),
 *       country: z.string(),
 *       postalCode: z.string(),
 *     }),
 *   }),
 * };
 * 
 * fastify.post('/orders', {
 *   preHandler: validateRequest(createOrderSchema),
 *   handler: createOrderHandler,
 * });
 */

/**
 * Helper function to create a validation schema for ID parameters
 */
export const createIdParamSchema = () => ({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

/**
 * Helper function to create a validation schema for pagination
 */
export const createPaginationSchema = () => ({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

/**
 * Helper function to create a validation schema for date range queries
 */
export const createDateRangeSchema = () => ({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

/**
 * Helper function to combine multiple validation schemas
 */
export const combineSchemas = (...schemas: ValidationConfig[]): ValidationConfig => {
  return schemas.reduce((combined, schema) => {
    return {
      params: schema.params || combined.params,
      query: schema.query || combined.query,
      body: schema.body || combined.body,
    };
  }, {});
}; 
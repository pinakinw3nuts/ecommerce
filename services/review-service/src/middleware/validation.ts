import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError, ZodType } from 'zod';
import { appLogger as logger } from '../utils/logger';

/**
 * Interface for validation options
 */
interface ValidationOptions {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Formats ZodError into a user-friendly structure
 */
function formatZodError(error: ZodError) {
  return {
    message: 'Validation failed',
    errors: error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * Creates a validation middleware using Zod schemas
 * @param options - Object containing Zod schemas for body, query, and/or params
 * @returns Middleware function for request validation
 */
export function validateRequest(options: ValidationOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body if schema provided
      if (options.body && request.body) {
        request.body = options.body.parse(request.body);
      }

      // Validate query parameters if schema provided
      if (options.query && request.query) {
        request.query = options.query.parse(request.query);
      }

      // Validate URL parameters if schema provided
      if (options.params && request.params) {
        request.params = options.params.parse(request.params);
      }

    } catch (error) {
      if (error instanceof ZodError) {
        const formattedError = formatZodError(error);
        
        logger.debug({ 
          validation: 'failed',
          error: formattedError,
          path: request.url,
        }, 'Request validation failed');
        
        return reply.status(400).send(formattedError);
      }
      
      // Handle unexpected errors
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown validation error',
        path: request.url,
      }, 'Unexpected validation error');
      
      return reply.status(500).send({ 
        message: 'Internal server error during validation'
      });
    }
  };
}

/**
 * Example schemas for common validations
 */
export const commonSchemas = {
  id: z.string().uuid('Invalid UUID format'),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  rating: z.number().int().min(1).max(5),
};

/**
 * Example usage:
 * 
 * const createReviewSchema = z.object({
 *   productId: commonSchemas.id,
 *   rating: commonSchemas.rating,
 *   title: z.string().min(3).max(100),
 *   content: z.string().min(10).max(1000),
 * });
 * 
 * fastify.post('/reviews', {
 *   preHandler: validateRequest({ body: createReviewSchema }),
 *   handler: async (request, reply) => {
 *     // Body is now validated and typed
 *     const review = request.body;
 *     // ...
 *   }
 * });
 */ 
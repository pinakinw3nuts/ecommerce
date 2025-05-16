import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError } from 'zod';
import logger from '../utils/logger';

const validationLogger = logger.child({ module: 'request-validation' });

export interface ValidationSchemas {
  body?: z.ZodSchema;
  querystring?: z.ZodSchema;
  params?: z.ZodSchema;
}

function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
}

/**
 * Creates a validation middleware using the provided schemas
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body if schema provided
      if (schemas.body) {
        try {
          request.body = await schemas.body.parseAsync(request.body);
        } catch (error) {
          if (error instanceof ZodError) {
            validationLogger.warn({
              path: request.url,
              body: request.body,
              errors: error.errors
            }, 'Request body validation failed');

            return reply.status(400).send({
              status: 'error',
              message: 'Invalid request body',
              errors: formatZodError(error)
            });
          }
          throw error;
        }
      }

      // Validate query parameters if schema provided
      if (schemas.querystring) {
        try {
          request.query = await schemas.querystring.parseAsync(request.query);
        } catch (error) {
          if (error instanceof ZodError) {
            validationLogger.warn({
              path: request.url,
              query: request.query,
              errors: error.errors
            }, 'Query parameters validation failed');

            return reply.status(400).send({
              status: 'error',
              message: 'Invalid query parameters',
              errors: formatZodError(error)
            });
          }
          throw error;
        }
      }

      // Validate URL parameters if schema provided
      if (schemas.params) {
        try {
          request.params = await schemas.params.parseAsync(request.params);
        } catch (error) {
          if (error instanceof ZodError) {
            validationLogger.warn({
              path: request.url,
              params: request.params,
              errors: error.errors
            }, 'URL parameters validation failed');

            return reply.status(400).send({
              status: 'error',
              message: 'Invalid URL parameters',
              errors: formatZodError(error)
            });
          }
          throw error;
        }
      }

    } catch (error) {
      validationLogger.error({ error }, 'Unexpected error during request validation');
      return reply.status(500).send({
        status: 'error',
        message: 'Internal server error during validation'
      });
    }
  };
};

// Common validation schemas
export const commonValidators = {
  pagination: z.object({
    page: z.string()
      .optional()
      .default('1')
      .transform(Number)
      .refine(n => n > 0, 'Page must be greater than 0'),
    limit: z.string()
      .optional()
      .default('10')
      .transform(Number)
      .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
  }),

  id: z.object({
    id: z.string().uuid('Invalid ID format')
  }),

  search: z.object({
    q: z.string()
      .min(1, 'Search query cannot be empty')
      .max(100, 'Search query too long')
  })
};

// Example usage of common validators
export const commonRequestValidators = {
  /**
   * Validates pagination parameters in query string
   */
  withPagination: validateRequest({
    querystring: commonValidators.pagination
  }),

  /**
   * Validates UUID parameter in URL
   */
  withId: validateRequest({
    params: commonValidators.id
  }),

  /**
   * Validates search query parameter
   */
  withSearch: validateRequest({
    querystring: commonValidators.search
  })
}; 
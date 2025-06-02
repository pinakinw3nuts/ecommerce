import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware for validating request data using Zod schemas
 * 
 * @param schema - Zod schema for validating request
 * @returns Middleware function that validates request against schema
 */
export function validateRequest(schema: ZodSchema) {
  return async (req: FastifyRequest, reply: FastifyReply, done: Function) => {
    try {
      // Validate request against schema
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers
      });
      
      // Continue to next middleware/handler if validation passes
      done();
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        logger.debug('Request validation failed', {
          path: req.url,
          errors: error.errors
        });
        
        // Format validation errors
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        // Send validation error response
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: formattedErrors
        });
      }
      
      // Handle unexpected errors
      logger.error('Unexpected validation error', { error });
      return reply.status(500).send({
        success: false,
        message: 'Internal server error during validation'
      });
    }
  };
}

/**
 * Common validation schemas for reuse across the application
 */
export const commonValidations = {
  /**
   * UUID format validation
   */
  uuid: (fieldName: string = 'id') => ({
    message: `Invalid ${fieldName} format. Must be a valid UUID.`,
    regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  }),
  
  /**
   * Pagination parameters validation
   */
  pagination: {
    page: {
      type: 'number',
      minimum: 1,
      message: 'Page must be a positive number',
    },
    limit: {
      type: 'number',
      minimum: 1,
      maximum: 100,
      message: 'Limit must be between 1 and 100',
    },
  },
  
  /**
   * Slug format validation
   */
  slug: {
    message: 'Slug must contain only letters, numbers, and hyphens',
    regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
}; 
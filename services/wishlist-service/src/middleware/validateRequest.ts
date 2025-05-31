import { FastifyRequest, FastifyReply } from 'fastify';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validation location in the request
 */
export type ValidationTarget = 'body' | 'params' | 'query' | 'headers';

/**
 * Options for the validation middleware
 */
export interface ValidationOptions {
  /**
   * Whether to strip unknown properties from the validated object
   */
  stripUnknown?: boolean;
}

/**
 * Create a middleware that validates request data against a Zod schema
 * 
 * @param schema - The Zod schema to validate against
 * @returns A middleware function that validates the request
 */
export function validateRequest(schema: AnyZodObject) {
  return (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    try {
      // Combine all request parts into a single object for validation
      const dataToValidate = {
        body: request.body,
        query: request.query,
        params: request.params,
        headers: request.headers,
      };

      // Validate against the schema
      const validatedData = schema.parse(dataToValidate);

      // Update request with validated data
      request.body = validatedData.body;
      request.query = validatedData.query;
      request.params = validatedData.params;

      done();
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        logger.debug('Validation error:', { error: error.errors });
        
        reply.status(400).send({
          message: 'Validation error',
          error: 'VALIDATION_ERROR',
          details: error.errors
        });
        return;
      }

      // Handle other errors
      logger.error('Unexpected validation error:', { error });
      reply.status(500).send({
        message: 'Internal server error during validation',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
} 
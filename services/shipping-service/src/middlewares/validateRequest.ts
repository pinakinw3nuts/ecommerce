import fastify from 'fastify';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Type definitions for Fastify
type FastifyRequest = any;
type FastifyReply = any;

/**
 * Request validation middleware using Zod schemas
 * @param schema - Zod schema for validation
 * @param source - Source of data to validate (body, params, query, headers)
 */
export function validateRequest(schema: z.ZodTypeAny, source: 'body' | 'params' | 'query' | 'headers' = 'body') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get the data to validate based on the source
      const data = source === 'body' ? request.body : 
                   source === 'params' ? request.params : 
                   source === 'query' ? request.query : 
                   request.headers;
      
      // Validate the data against the schema
      const validatedData = await schema.parseAsync(data);
      
      // Replace the original data with the validated data
      if (source === 'body') {
        request.body = validatedData;
      } else if (source === 'params') {
        request.params = validatedData;
      } else if (source === 'query') {
        request.query = validatedData;
      } else {
        request.headers = validatedData;
      }
    } catch (error) {
      // Log validation error
      logger.warn({
        msg: 'Validation error',
        source,
        error: error instanceof z.ZodError ? error.errors : String(error)
      });
      
      // Send validation error response
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      // Handle other errors
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid request data',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

/**
 * Add pagination to a Zod schema
 * @param schema - Base Zod schema
 * @returns Schema with pagination fields
 */
export function withPagination<T extends z.ZodTypeAny>(schema: T): z.ZodObject<any> {
  // Create a new schema with pagination fields
  return z.object({
    ...(schema instanceof z.ZodObject ? schema.shape : {}),
    page: z.number().int().min(1).default(1).optional(),
    limit: z.number().int().min(1).max(100).default(10).optional()
  });
} 
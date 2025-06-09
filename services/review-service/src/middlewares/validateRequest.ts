import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { apiLogger } from '../utils/logger';

/**
 * Middleware to validate request using Zod schema
 * @param schema Zod schema to validate request against
 * @param location Where to find the data to validate (body, query, params)
 */
export function validateRequest<T extends ZodSchema>(
  schema: T,
  location: 'body' | 'query' | 'params' = 'body'
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request[location];
      const validatedData = await schema.parseAsync(data);
      
      // Replace the request data with the validated data
      request[location] = validatedData;
    } catch (error) {
      apiLogger.warn({ error }, 'Request validation failed');
      
      // Return validation error
      return reply.code(400).send({
        message: 'Validation error',
        errors: error instanceof ZodError ? error.errors : String(error)
      });
    }
  };
} 
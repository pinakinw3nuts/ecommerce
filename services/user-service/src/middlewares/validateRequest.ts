import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import logger from '../utils/logger';

export interface ValidationSchemas {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
}

/**
 * Formats Zod validation errors into a user-friendly format
 */
const formatZodError = (error: z.ZodError) => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Creates a validation middleware using provided Zod schemas
 * @param schemas - Object containing Zod schemas for body, query, and/or params
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body if schema provided
      if (schemas.body) {
        request.body = await schemas.body.parseAsync(request.body);
      }

      // Validate query parameters if schema provided
      if (schemas.query) {
        request.query = await schemas.query.parseAsync(request.query);
      }

      // Validate URL parameters if schema provided
      if (schemas.params) {
        request.params = await schemas.params.parseAsync(request.params);
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = formatZodError(error);
        
        logger.debug({ 
          body: request.body,
          query: request.query,
          params: request.params,
          errors: validationErrors 
        }, 'Request validation failed');

        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          validationErrors,
        });
      }

      // Handle unexpected errors
      logger.error({ error }, 'Unexpected validation error');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
};

// Example usage:
/*
const createUserSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
  }),
};

fastify.post('/users',
  { preValidation: validateRequest(createUserSchema) },
  async (request, reply) => {
    // Request body is validated and typed
    const { email, password, name } = request.body;
    // Handle request...
  }
);

const getUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.enum(['asc', 'desc']).default('asc'),
  }),
};

fastify.get('/users',
  { preValidation: validateRequest(getUsersSchema) },
  async (request, reply) => {
    // Query params are validated and typed
    const { page, limit, sort } = request.query;
    // Handle request...
  }
);
*/ 
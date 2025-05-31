import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('validation-middleware');

/**
 * Validation sources in the request
 */
type ValidationSource = 'body' | 'query' | 'params' | 'headers';

/**
 * Middleware factory for validating request parts using Zod schemas
 * 
 * @param schema The Zod schema to validate against
 * @param part The part of the request to validate ('body', 'query', or 'params')
 * @returns A middleware function that validates the specified request part
 */
export function validateRequest<T extends z.ZodType>(schema: T, part: ValidationSource) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get the data to validate
      const data = request[part];
      
      // Validate the data against the schema
      const validatedData = await schema.parseAsync(data);
      
      // Replace the request part with the validated data
      request[part] = validatedData;
      
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.map(p => String(p)).join('.'),
          message: err.message
        }));
        
        logger.debug({ 
          errors: formattedErrors,
          requestPart: part
        }, 'Request validation failed');
        
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation error',
          errors: formattedErrors
        });
      }
      
      // Handle other errors
      logger.error({ error }, 'Unexpected error during request validation');
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during request validation'
      });
    }
  };
}

/**
 * Validate multiple parts of the request at once
 */
export function validateMultiple(validations: {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
  headers?: z.ZodType<any>;
}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    for (const [source, schema] of Object.entries(validations)) {
      if (schema) {
        const validator = validateRequest(
          schema, 
          source as ValidationSource
        );
        
        // Run the validator and return early if validation fails
        await validator(request, reply);
        if (reply.sent) {
          return;
        }
      }
    }
  };
}

/**
 * Usage example:
 * 
 * import { z } from 'zod';
 * import { validateRequest } from '../middlewares/validateRequest';
 * 
 * const createUserSchema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 *   age: z.number().int().positive().optional()
 * });
 * 
 * fastify.post('/users', {
 *   preHandler: validateRequest(createUserSchema),
 *   handler: async (request, reply) => {
 *     // request.body is now validated and typed
 *     const user = await userService.create(request.body);
 *     return reply.code(201).send(user);
 *   }
 * });
 */ 
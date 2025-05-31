import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError, ZodSchema } from 'zod';
import logger from '../utils/logger';

// Input location options for validation
export enum ValidateTarget {
  BODY = 'body',
  PARAMS = 'params',
  QUERY = 'query',
  HEADERS = 'headers'
}

// Custom error formatter
interface ValidationErrorOutput {
  success: boolean;
  message: string;
  code: string;
  errors: {
    field: string;
    message: string;
    code: string;
  }[];
}

/**
 * Format Zod validation errors into a standardized error response
 */
function formatZodError(error: ZodError): ValidationErrorOutput {
  return {
    success: false,
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    errors: error.errors.map(err => {
      // Extract field path as string (e.g., "email", "address.zipCode")
      const field = err.path.join('.');
      
      // Generate an error code based on the validation issue
      let code = 'INVALID_VALUE';
      if (err.code === 'invalid_type') {
        code = err.expected === 'string' ? 'INVALID_STRING' : 
               err.expected === 'number' ? 'INVALID_NUMBER' : 
               `INVALID_${err.expected?.toUpperCase() || 'TYPE'}`;
      } else if (err.code === 'too_small') {
        code = err.type === 'string' ? 'STRING_TOO_SHORT' : 'VALUE_TOO_SMALL';
      } else if (err.code === 'too_big') {
        code = err.type === 'string' ? 'STRING_TOO_LONG' : 'VALUE_TOO_BIG';
      } else if (err.code === 'invalid_string') {
        // Handle different validation types safely
        const validationType = typeof err.validation === 'string' 
          ? err.validation.toUpperCase() 
          : 'FORMAT';
          
        code = `INVALID_${validationType}`;
      }
      
      return {
        field,
        message: err.message,
        code
      };
    })
  };
}

/**
 * Factory function that creates a validation middleware
 * for request body, params, or query using Zod schema
 * 
 * @param schema Zod schema for validation
 * @param target Request part to validate (body, params, query)
 * @returns Fastify middleware
 */
export function validateRequest(schema: ZodSchema, target: ValidateTarget = ValidateTarget.BODY) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Get the data to validate based on target
      const data = request[target];
      
      // Validate the data against the schema
      const validatedData = await schema.parseAsync(data);
      
      // Replace the original data with the validated (and potentially transformed) data
      request[target] = validatedData;
    } catch (err) {
      // If validation fails, log the error and send a 400 response
      if (err instanceof ZodError) {
        logger.debug({
          requestId: request.id,
          path: request.url,
          target,
          validation: formatZodError(err)
        }, 'Request validation failed');
        
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          error: 'INVALID_DATA',
          details: formatZodError(err)
        });
      }
      
      // For other errors, log and send a 500
      logger.error({
        err,
        requestId: request.id,
        path: request.url
      }, 'Unexpected error during request validation');
      
      return reply.status(500).send({
        success: false,
        message: 'Internal server error during validation',
        error: 'SERVER_ERROR'
      });
    }
  };
}

/**
 * Validates multiple parts of a request in a single middleware
 * 
 * @param schemas Object containing schemas for different parts of the request
 * @returns Fastify middleware
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
  headers?: ZodSchema;
}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate body if schema provided
      if (schemas.body && request.body) {
        request.body = await schemas.body.parseAsync(request.body);
      }
      
      // Validate params if schema provided
      if (schemas.params && request.params) {
        request.params = await schemas.params.parseAsync(request.params);
      }
      
      // Validate query if schema provided
      if (schemas.query && request.query) {
        request.query = await schemas.query.parseAsync(request.query);
      }
      
      // Validate headers if schema provided
      if (schemas.headers && request.headers) {
        // We don't replace the headers, just validate them
        await schemas.headers.parseAsync(request.headers);
      }
      
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const formattedError = formatZodError(error);
        
        logger.debug({ 
          errors: formattedError.errors,
          path: request.url
        }, 'Request validation failed');
        
        return reply.code(400).send(formattedError);
      }
      
      // Handle unexpected errors
      logger.error({ error, path: request.url }, 'Unexpected validation error');
      
      return reply.code(500).send({
        success: false,
        message: 'Internal server error during validation',
        code: 'VALIDATION_ERROR'
      });
    }
  };
} 
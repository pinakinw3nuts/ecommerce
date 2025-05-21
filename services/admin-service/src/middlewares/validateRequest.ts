import { FastifyRequest, FastifyReply } from 'fastify';
import { AnyZodObject, ZodError, ZodIssue } from 'zod';
import logger from '../utils/logger';

/**
 * Type for validation schema locations in request
 */
export type ValidationType = 'body' | 'params' | 'query' | 'headers';

/**
 * Error response interface for consistent error formatting
 */
interface ValidationErrorResponse {
  success: boolean;
  message: string;
  errors: {
    field: string;
    message: string;
  }[];
}

/**
 * Format ZodError into a consistent error response shape
 */
const formatZodError = (error: ZodError): ValidationErrorResponse['errors'] => {
  return error.errors.map((err: ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Create a validation middleware using the provided Zod schema
 * @param schema - Zod schema to validate against
 * @param type - Request part to validate (body, params, query, headers)
 */
export const validateRequest = (schema: AnyZodObject, type: ValidationType = 'body') => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Validate request data against schema
      await schema.parseAsync(request[type]);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const formattedErrors = formatZodError(error);
        
        logger.debug({
          path: request.url,
          method: request.method,
          errors: formattedErrors
        }, 'Request validation failed');
        
        // Send consistent error response
        reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: formattedErrors
        });
      } else {
        // Handle unexpected errors
        logger.error(error, 'Unexpected validation error');
        
        reply.status(500).send({
          success: false,
          message: 'Internal server error during validation',
          errors: []
        });
      }
    }
  };
};

/**
 * Create a validation middleware that validates multiple parts of the request
 * @param schemas - Object mapping request parts to their schemas
 */
export const validateRequestParts = (schemas: Partial<Record<ValidationType, AnyZodObject>>) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const validationErrors: ValidationErrorResponse['errors'] = [];
    
    // Validate each part of the request
    for (const [type, schema] of Object.entries(schemas) as [ValidationType, AnyZodObject][]) {
      try {
        await schema.parseAsync(request[type]);
      } catch (error) {
        if (error instanceof ZodError) {
          validationErrors.push(...formatZodError(error));
        } else {
          logger.error(error, `Unexpected validation error in ${type}`);
          
          reply.status(500).send({
            success: false,
            message: 'Internal server error during validation',
            errors: []
          });
          return;
        }
      }
    }
    
    // If validation errors were found, return them
    if (validationErrors.length > 0) {
      logger.debug({
        path: request.url,
        method: request.method,
        errors: validationErrors
      }, 'Request validation failed');
      
      reply.status(400).send({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
  };
}; 
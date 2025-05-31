import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError, ZodObject, ZodType, z } from 'zod';
import logger from '../utils/logger';

interface ValidationSchema {
  body?: ZodType<any>;
  params?: ZodType<any>;
  querystring?: ZodType<any>;
  headers?: ZodObject<any>;
}

/**
 * Middleware for validating request data against Zod schemas
 */
export function validateRequest(schema: ValidationSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body if schema provided
      if (schema.body) {
        request.body = schema.body.parse(request.body);
      }
      
      // Validate URL parameters if schema provided
      if (schema.params) {
        request.params = schema.params.parse(request.params);
      }
      
      // Validate query string parameters if schema provided
      if (schema.querystring) {
        request.query = schema.querystring.parse(request.query);
      }
      
      // Validate headers if schema provided
      if (schema.headers) {
        // Only validate the headers specified in the schema
        // This avoids trying to validate all headers, many of which are added by the server
        const headersToValidate = Object.keys(schema.headers.shape || {}).reduce(
          (acc, key) => {
            acc[key] = request.headers[key];
            return acc;
          },
          {} as Record<string, unknown>
        );
        
        const validatedHeaders = schema.headers.parse(headersToValidate);
        
        // Merge validated headers back into request.headers
        Object.assign(request.headers, validatedHeaders);
      }
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        logger.debug('Request validation failed', {
          url: request.url,
          method: request.method,
          errors: validationErrors
        });
        
        return reply.status(400).send({
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      // Handle other errors
      logger.error('Unexpected validation error', {
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        message: 'An unexpected error occurred during validation',
        error: 'VALIDATION_ERROR'
      });
    }
  };
}

/**
 * Helper function to create a schema for notification payload
 * @param dataSchema - Schema for the data field specific to each notification type
 * @returns Zod schema for the notification payload
 */
export function createNotificationSchema<T extends ZodType<any>>(dataSchema: T) {
  return z.object({
    type: z.string().min(1).describe('Notification type (e.g., ORDER_CONFIRMED)'),
    recipients: z.array(z.string().email()).min(1).describe('Array of recipient email addresses'),
    data: dataSchema,
    channel: z.enum(['email', 'sms', 'push', 'all']).default('email').describe('Notification channel'),
    priority: z.enum(['high', 'normal', 'low']).default('normal').describe('Notification priority'),
    scheduledTime: z.string().datetime().optional().describe('Schedule notification for a future time (ISO-8601 date string)')
  });
}

/**
 * Common schema for pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('Page number'),
  limit: z.coerce.number().int().positive().max(100).default(20).describe('Items per page')
});

/**
 * Common schema for date range filtering
 */
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional().describe('Start date (ISO-8601)'),
  to: z.string().datetime().optional().describe('End date (ISO-8601)')
});

/**
 * Common schema for sorting parameters
 */
export function createSortSchema<T extends readonly [string, ...string[]]>(allowedFields: T) {
  return z.object({
    sortBy: z.enum(allowedFields).default(allowedFields[0]).describe('Field to sort by'),
    sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort direction')
  });
} 
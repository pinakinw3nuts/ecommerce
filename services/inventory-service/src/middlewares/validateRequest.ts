import { FastifyRequest, FastifyReply } from 'fastify';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateBody(schema: AnyZodObject) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      const zodError = error as ZodError;
      logger.warn({ 
        path: request.url, 
        body: request.body,
        errors: zodError.errors 
      }, 'Request body validation failed');
      
      return reply.code(400).send({
        message: 'Invalid request body',
        errors: zodError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
}

/**
 * Middleware to validate request params against a Zod schema
 */
export function validateParams(schema: AnyZodObject) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.params = schema.parse(request.params);
    } catch (error) {
      const zodError = error as ZodError;
      logger.warn({ 
        path: request.url, 
        params: request.params,
        errors: zodError.errors 
      }, 'Request params validation failed');
      
      return reply.code(400).send({
        message: 'Invalid request parameters',
        errors: zodError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
}

/**
 * Middleware to validate request query against a Zod schema
 */
export function validateQuery(schema: AnyZodObject) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query);
    } catch (error) {
      const zodError = error as ZodError;
      logger.warn({ 
        path: request.url, 
        query: request.query,
        errors: zodError.errors 
      }, 'Request query validation failed');
      
      return reply.code(400).send({
        message: 'Invalid query parameters',
        errors: zodError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
} 
import fastify from 'fastify';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

// Type definitions for Fastify
type FastifyError = any;
type FastifyRequest = any;
type FastifyReply = any;

/**
 * Custom error response interface
 */
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: any;
}

/**
 * Global error handler for the application
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error details
  logger.error({
    msg: 'Request error',
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    },
    request: {
      url: request.url || 'unknown',
      method: request.method || 'unknown',
      params: request.params,
      query: request.query,
      body: request.body
    }
  });

  // Handle validation errors
  if (error.validation || error instanceof ZodError) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation error',
      details: error.validation || error.errors || error.message
    });
  }

  // Handle database errors
  if (error.code && error.code.startsWith('23')) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Database constraint violation',
      details: error.detail || error.message
    });
  }

  // Handle not found errors
  if (error.statusCode === 404 || error.message === 'Not Found') {
    return reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: error.message
    });
  }

  // Handle authorization errors
  if (error.statusCode === 401 || error.message === 'Unauthorized') {
    return reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message || 'Authentication required'
    });
  }

  // Handle forbidden errors
  if (error.statusCode === 403 || error.message === 'Forbidden') {
    return reply.code(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: error.message || 'Insufficient permissions'
    });
  }

  // Default to 500 internal server error
  return reply.code(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
}

/**
 * Handler for 404 Not Found errors
 */
export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  logger.warn({
    msg: 'Route not found',
    request: {
      url: request.url || 'unknown',
      method: request.method || 'unknown'
    }
  });

  return reply.code(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: `Route ${request.method || 'unknown'}:${request.url || 'unknown'} not found`
  });
} 
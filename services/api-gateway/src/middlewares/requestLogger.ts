import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { httpLogger as logger } from '../utils/logger';
import { config } from '../config/env';

/**
 * Configure request logging middleware
 */
export async function configureRequestLogger(fastify: FastifyInstance) {
  // Log all incoming requests
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const startTime = process.hrtime();

    // Store the start time for later use
    request.startTime = startTime;

    logger.info({
      msg: 'Incoming request',
      method: request.method,
      url: request.url,
      headers: {
        ...request.headers,
        // Omit sensitive headers
        authorization: request.headers.authorization ? '[REDACTED]' : undefined,
        cookie: request.headers.cookie ? '[REDACTED]' : undefined,
      },
      query: request.query,
      params: request.params,
      requestId: request.headers['x-request-id'],
      ip: request.ip,
    });
  });

  // Log response details
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    logger.info({
      msg: 'Request completed',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
      requestId: request.headers['x-request-id'],
      ...(config.server.nodeEnv === 'development' && {
        headers: reply.getHeaders(),
      }),
    });
  });

  // Log errors
  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    logger.error({
      err: error,
      msg: 'Request error',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      requestId: request.headers['x-request-id'],
    });
  });

  // Log when server is shutting down
  fastify.addHook('onClose', async () => {
    logger.info('Shutting down request logger');
  });

  logger.info('Request logger configured');
}

// Add custom properties to FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    startTime: [number, number];
  }
}

// Example usage:
/*
import fastify from 'fastify';
import { configureRequestLogging } from './middlewares/requestLogger';

const app = fastify();

// Configure request logging
configureRequestLogging(app);
*/ 
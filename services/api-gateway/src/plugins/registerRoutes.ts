import { FastifyInstance } from 'fastify';
import { config } from '../config/env';
import { httpLogger as logger } from '../utils/logger';

/**
 * Register all application routes
 */
export async function registerRoutes(fastify: FastifyInstance) {
  try {
    // Register health check routes
    await fastify.register(import('../routes/health.routes'), { prefix: '/health' });

    // Register proxy routes
    await fastify.register(import('../routes/proxy.routes'), { prefix: '/api' });

    // Register auth routes
    await fastify.register(import('../routes/auth'), { prefix: '/auth' });

    // Development only routes
    if (config.server.nodeEnv === 'development') {
      logger.debug('Development mode: Additional routes would be registered here');
    }

    logger.info('Routes registered successfully');
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to register routes',
      ...(config.server.nodeEnv === 'development' && error instanceof Error && { error: error.message }),
    });
    throw error;
  }
}

// Example usage:
/*
import fastify from 'fastify';
import registerRoutes from './plugins/registerRoutes';

const app = fastify();

await app.register(registerRoutes, {
  prefix: '/api'
});

// Now you can access:
// GET /api/auth/ping
*/ 
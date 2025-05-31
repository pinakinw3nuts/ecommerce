import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { forwardHandler } from '../controllers/forward.controller';
import { httpLogger as logger } from '../utils/logger';

const proxyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Log when routes are being registered
  logger.info('Registering proxy routes');

  // Auth Service Routes
  fastify.all('/api/auth/*', forwardHandler);

  // User Service Routes
  fastify.all('/api/users/*', forwardHandler);

  // Product Service Routes
  fastify.all('/api/products/*', forwardHandler);

  // Cart Service Routes
  fastify.all('/api/cart/*', forwardHandler);

  // Checkout Service Routes
  fastify.all('/api/checkout/*', forwardHandler);

  // Order Service Routes
  fastify.all('/api/orders/*', forwardHandler);

  // Payment Service Routes
  fastify.all('/api/payments/*', forwardHandler);

  // Shipping Service Routes
  fastify.all('/api/shipping/*', forwardHandler);

  // Inventory Service Routes
  fastify.all('/api/inventory/*', forwardHandler);

  // Company Service Routes
  fastify.all('/api/company/*', forwardHandler);

  // Pricing Service Routes
  fastify.all('/api/pricing/*', forwardHandler);

  // Admin Service Routes
  fastify.all('/api/admin/*', forwardHandler);

  // Health check for proxy routes
  fastify.get('/api/status', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      routes: [
        '/api/auth/*', 
        '/api/users/*', 
        '/api/products/*',
        '/api/cart/*',
        '/api/checkout/*',
        '/api/orders/*',
        '/api/payments/*',
        '/api/shipping/*',
        '/api/inventory/*',
        '/api/company/*',
        '/api/pricing/*',
        '/api/admin/*'
      ]
    });
  });

  // Catch-all route for unmatched API paths
  fastify.all('/api/*', async (request, reply) => {
    logger.warn({
      msg: 'Unmatched API route accessed',
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id']
    });

    return reply.status(404).send({
      status: 404,
      code: 'NOT_FOUND',
      message: 'The requested API endpoint does not exist',
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id']
    });
  });
};

export default proxyRoutes; 
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { forwardHandler } from '../controllers/forward.controller';
import { httpLogger as logger } from '../utils/logger';

const proxyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Log when routes are being registered
  logger.info('Registering proxy routes');

  // Auth Service Routes - support both versioned and non-versioned paths
  fastify.all('/api/auth/*', forwardHandler);
  fastify.all('/api/v:version/auth/*', forwardHandler);

  // User Service Routes
  fastify.all('/api/users/*', forwardHandler);
  fastify.all('/api/v:version/users/*', forwardHandler);

  // Product Service Routes
  fastify.all('/api/products/*', forwardHandler);
  fastify.all('/api/v:version/products/*', forwardHandler);

  // Cart Service Routes
  fastify.all('/api/cart/*', forwardHandler);
  fastify.all('/api/v:version/cart/*', forwardHandler);

  // Checkout Service Routes
  fastify.all('/api/checkout/*', forwardHandler);
  fastify.all('/api/v:version/checkout/*', forwardHandler);

  // Order Service Routes
  fastify.all('/api/orders/*', forwardHandler);
  fastify.all('/api/v:version/orders/*', forwardHandler);

  // Payment Service Routes
  fastify.all('/api/payments/*', forwardHandler);
  fastify.all('/api/v:version/payments/*', forwardHandler);

  // Shipping Service Routes
  fastify.all('/api/shipping/*', forwardHandler);
  fastify.all('/api/v:version/shipping/*', forwardHandler);

  // Inventory Service Routes
  fastify.all('/api/inventory/*', forwardHandler);
  fastify.all('/api/v:version/inventory/*', forwardHandler);

  // Company Service Routes
  fastify.all('/api/company/*', forwardHandler);
  fastify.all('/api/v:version/company/*', forwardHandler);

  // Pricing Service Routes
  fastify.all('/api/pricing/*', forwardHandler);
  fastify.all('/api/v:version/pricing/*', forwardHandler);

  // Admin Service Routes
  fastify.all('/api/admin/*', forwardHandler);
  fastify.all('/api/v:version/admin/*', forwardHandler);

  // Health check for proxy routes
  fastify.get('/api/status', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      routes: [
        '/api/auth/*', '/api/v:version/auth/*',
        '/api/users/*', '/api/v:version/users/*',
        '/api/products/*', '/api/v:version/products/*',
        '/api/cart/*', '/api/v:version/cart/*',
        '/api/checkout/*', '/api/v:version/checkout/*',
        '/api/orders/*', '/api/v:version/orders/*',
        '/api/payments/*', '/api/v:version/payments/*',
        '/api/shipping/*', '/api/v:version/shipping/*',
        '/api/inventory/*', '/api/v:version/inventory/*',
        '/api/company/*', '/api/v:version/company/*',
        '/api/pricing/*', '/api/v:version/pricing/*',
        '/api/admin/*', '/api/v:version/admin/*'
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
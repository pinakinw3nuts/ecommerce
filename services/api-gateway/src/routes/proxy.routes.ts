import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { forwardHandler } from '../controllers/forward.controller';
import { httpLogger as logger } from '../utils/logger';
import { getAllRoutes } from '../config/serviceRegistry';

const proxyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Log when routes are being registered
  logger.info('Registering proxy routes');

  // Register a single catch-all route for all API requests
  fastify.all('/api/*', forwardHandler);

  // Health check for proxy routes
  fastify.get('/api/status', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      routes: getAllRoutes()
    });
  });
};

export default proxyRoutes; 
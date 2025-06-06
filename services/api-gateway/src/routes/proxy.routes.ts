import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { forwardHandler } from '../controllers/forward.controller';
import { httpLogger as logger } from '../utils/logger';
import { getAllRoutes } from '../config/serviceRegistry';

const proxyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Log when routes are being registered
  logger.info('Registering proxy routes');

  // Register a catch-all route for all API requests except auth routes
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip this hook for auth routes which are handled separately
    if (request.url.startsWith('/api/auth/')) {
      return;
    }
    
    // Skip for the status endpoint
    if (request.url === '/api/status') {
      return;
    }
    
    // For all other API routes, use the forward handler
    if (request.url.startsWith('/api/')) {
      logger.debug({
        msg: 'Handling request via proxy route',
        url: request.url,
        method: request.method
      });
      
      return forwardHandler(request, reply);
    }
  });

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
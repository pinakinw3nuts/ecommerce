import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { forwardHandler } from '../controllers/forward.controller';
import { httpLogger as logger } from '../utils/logger';
import { getAllRoutes } from '../config/serviceRegistry';
import { config } from '../config/env';
import { forwardRequest } from '../utils/httpClient';

const proxyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Log when routes are being registered
  logger.info('Registering proxy routes');

  // Specific route for featured products
  fastify.get('/api/v1/products/featured', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding featured products request',
        url: `${productServiceUrl}/api/v1/products/featured${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/products/featured${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Featured products response received',
        status: response.status,
        productsCount: response.body && typeof response.body === 'object' && 'products' in response.body 
          ? Array.isArray((response.body as any).products) ? (response.body as any).products.length : 'unknown'
          : 'no products'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in featured products proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch featured products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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
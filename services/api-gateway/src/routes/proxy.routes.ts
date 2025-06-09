import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { forwardHandler } from '../controllers/forward.controller';
import { httpLogger as logger } from '../utils/logger';
import { getAllRoutes } from '../config/serviceRegistry';
import { config } from '../config/env';
import { forwardRequest } from '../utils/httpClient';

const proxyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Log when routes are being registered
  logger.info('Registering proxy routes');

  // Specific route for CMS home widget
  fastify.get('/v1/widget/home', async (request, reply) => {
    try {
      const cmsServiceUrl = config.services.cms;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding CMS home widget request',
        url: `${cmsServiceUrl}/api/v1/widget/home${queryString}`,
        method: 'GET'
      });

      // Forward directly to CMS service
      const response = await forwardRequest({
        method: 'GET',
        url: `${cmsServiceUrl}/api/v1/widget/home${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(cmsServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'CMS home widget response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in CMS home widget proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch CMS home widget',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for featured products
  fastify.get('/v1/products/featured', async (request, reply) => {
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

  // Specific route for sale products
  fastify.get('/v1/products/sale', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding sale products request',
        url: `${productServiceUrl}/api/v1/products/sale${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/products/sale${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Sale products response received',
        status: response.status,
        productsCount: response.body && typeof response.body === 'object' && 'products' in response.body 
          ? Array.isArray((response.body as any).products) ? (response.body as any).products.length : 'unknown'
          : 'no products'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in sale products proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch sale products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for featured categories
  fastify.get('/v1/categories/featured', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding featured categories request',
        url: `${productServiceUrl}/api/v1/categories/featured${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/categories/featured${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Featured categories response received',
        status: response.status,
        categoriesCount: response.body && typeof response.body === 'object' && 'categories' in response.body 
          ? Array.isArray((response.body as any).categories) ? (response.body as any).categories.length : 'unknown'
          : 'no categories'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in featured categories proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch featured categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for all products
  fastify.get('/v1/products', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding products request',
        url: `${productServiceUrl}/api/v1/products${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/products${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Products response received',
        status: response.status,
        productsCount: response.body && typeof response.body === 'object' && 'products' in response.body 
          ? Array.isArray((response.body as any).products) ? (response.body as any).products.length : 'unknown'
          : 'no products'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in products proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for all categories
  fastify.get('/v1/categories', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding categories request',
        url: `${productServiceUrl}/api/v1/categories${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/categories${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Categories response received',
        status: response.status,
        categoriesCount: response.body && typeof response.body === 'object' && 'categories' in response.body 
          ? Array.isArray((response.body as any).categories) ? (response.body as any).categories.length : 'unknown'
          : 'no categories'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in categories proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for product details by slug
  fastify.get('/v1/products/slug/:slug', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const slug = (request.params as any).slug;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding product details request',
        url: `${productServiceUrl}/api/v1/products/slug/${slug}${queryString}`,
        method: 'GET',
        slug
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/products/slug/${slug}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Product details response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in product details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch product details',
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
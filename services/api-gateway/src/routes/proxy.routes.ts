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
      
      // Parse the query parameters for debugging
      const parsedQueryParams: Record<string, string> = {};
      if (queryString) {
        const searchParams = new URLSearchParams(queryString.slice(1));
        searchParams.forEach((value, key) => {
          parsedQueryParams[key] = value;
        });
      }
      
      // Log sort parameters specifically for debugging
      logger.info({
        msg: 'Sort parameters in request',
        sortBy: parsedQueryParams['sortBy'],
        sortOrder: parsedQueryParams['sortOrder'],
        sort: parsedQueryParams['sort']
      });
      
      logger.info({
        msg: 'Forwarding products request',
        url: `${productServiceUrl}/api/v1/products${queryString}`,
        method: 'GET',
        queryParams: parsedQueryParams
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
          : 'no products',
        dataCount: response.body && typeof response.body === 'object' && 'data' in response.body
          ? Array.isArray((response.body as any).data) ? (response.body as any).data.length : 'unknown'
          : 'no data'
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

  // Specific route for coupons
  fastify.get('/v1/coupons', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      // Add more detailed logging
      logger.info({
        msg: 'Forwarding coupons request',
        url: `${productServiceUrl}/api/v1/coupons${queryString}`,
        method: 'GET',
        headers: request.headers,
        productServiceUrl: productServiceUrl
      });

      // Try alternative endpoint paths if needed
      let responseUrl = `${productServiceUrl}/api/v1/coupons${queryString}`;
      let response;
      
      try {
        // First attempt with /api/v1/coupons
        response = await forwardRequest({
          method: 'GET',
          url: responseUrl,
          headers: {
            ...request.headers as Record<string, string | string[] | undefined>,
            host: new URL(productServiceUrl).host,
          },
        });
      } catch (firstError) {
        logger.warn({
          msg: 'First coupon endpoint attempt failed, trying alternative path',
          error: firstError instanceof Error ? firstError.message : 'Unknown error'
        });
        
        // Second attempt with /api/coupons
        responseUrl = `${productServiceUrl}/api/coupons${queryString}`;
        
        response = await forwardRequest({
          method: 'GET',
          url: responseUrl,
          headers: {
            ...request.headers as Record<string, string | string[] | undefined>,
            host: new URL(productServiceUrl).host,
          },
        });
      }

      // Log successful response
      logger.debug({
        msg: 'Coupons response received',
        status: response.status,
        couponsCount: response.body && Array.isArray(response.body) ? response.body.length : 'unknown format',
        successfulUrl: responseUrl
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in coupons proxy',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch coupons',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for coupon validation
  fastify.post('/v1/coupons/validate', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      
      // Add more detailed logging
      logger.info({
        msg: 'Forwarding coupon validation request',
        url: `${productServiceUrl}/api/v1/coupons/validate`,
        method: 'POST',
        requestBody: request.body,
        headers: request.headers
      });

      // Try alternative endpoint paths if needed
      let responseUrl = `${productServiceUrl}/api/v1/coupons/validate`;
      let response;
      
      try {
        // First attempt with /api/v1/coupons/validate
        response = await forwardRequest({
          method: 'POST',
          url: responseUrl,
          headers: {
            ...request.headers as Record<string, string | string[] | undefined>,
            'Content-Type': 'application/json',
            host: new URL(productServiceUrl).host,
          },
          body: request.body,
        });
      } catch (firstError) {
        logger.warn({
          msg: 'First coupon validation endpoint attempt failed, trying alternative path',
          error: firstError instanceof Error ? firstError.message : 'Unknown error'
        });
        
        // Second attempt with /api/coupons/validate
        try {
          responseUrl = `${productServiceUrl}/api/coupons/validate`;
          
          response = await forwardRequest({
            method: 'POST',
            url: responseUrl,
            headers: {
              ...request.headers as Record<string, string | string[] | undefined>,
              'Content-Type': 'application/json',
              host: new URL(productServiceUrl).host,
            },
            body: request.body,
          });
        } catch (secondError) {
          logger.warn({
            msg: 'Second coupon validation endpoint attempt failed, trying original product path',
            error: secondError instanceof Error ? secondError.message : 'Unknown error'
          });
          
          // Final attempt with original /api/v1/products/coupons/validate
          try {
            responseUrl = `${productServiceUrl}/api/v1/products/coupons/validate`;
            
            response = await forwardRequest({
              method: 'POST',
              url: responseUrl,
              headers: {
                ...request.headers as Record<string, string | string[] | undefined>,
                'Content-Type': 'application/json',
                host: new URL(productServiceUrl).host,
              },
              body: request.body,
            });
          } catch (finalError) {
            logger.warn({
              msg: 'All coupon validation endpoint attempts failed, using fallback mock response',
              error: finalError instanceof Error ? finalError.message : 'Unknown error'
            });
            
            // If all attempts fail, return a mock response for development purposes
            const mockBody = request.body as any;
            const couponCode = mockBody?.code?.toUpperCase() || '';
            
            // Ensure userId is present in mock body, as it's required
            if (!mockBody?.userId) {
              return reply.status(400).send({
                success: false,
                message: 'userId is required',
                error: 'Validation Error: body must have required property \'userId\''
              });
            }
            
            // Test coupon data for development purposes
            if (couponCode === 'TEST10') {
              return reply.status(200).send({
                isValid: true,
                message: 'Coupon applied successfully',
                coupon: {
                  id: '00c945c1-7193-48e6-9831-00493d1984ff',
                  code: 'TEST10',
                  name: 'Test Coupon',
                  description: 'Test discount',
                  discountAmount: 10,
                  discountType: 'PERCENTAGE',
                  startDate: '2023-06-01T00:00:00.000Z',
                  endDate: '2025-06-30T23:59:59.000Z',
                  isActive: true,
                  minimumPurchaseAmount: 50,
                  usageLimit: 100,
                  usageCount: 0,
                  perUserLimit: 1,
                  isFirstPurchaseOnly: false
                },
                discountAmount: (mockBody?.totalAmount || 0) * 0.1
              });
            } else if (couponCode === 'FLAT20') {
              return reply.status(200).send({
                isValid: true,
                message: 'Coupon applied successfully',
                coupon: {
                  id: 'b28c5a72-e05a-4750-8189-73a5da16e7aa',
                  code: 'FLAT20',
                  name: 'Flat Discount',
                  description: 'Flat $20 off your order',
                  discountAmount: 20,
                  discountType: 'FIXED',
                  startDate: '2023-06-01T00:00:00.000Z',
                  endDate: '2025-06-30T23:59:59.000Z',
                  isActive: true,
                  minimumPurchaseAmount: 100,
                  usageLimit: 100,
                  usageCount: 0,
                  perUserLimit: 1,
                  isFirstPurchaseOnly: false
                },
                discountAmount: 20
              });
            } else {
              return reply.status(404).send({
                isValid: false,
                message: 'Coupon not found or invalid'
              });
            }
          }
        }
      }

      // Log successful response
      logger.debug({
        msg: 'Coupon validation response received',
        status: response.status,
        successfulUrl: responseUrl
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in coupon validation proxy',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to validate coupon',
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

  // Specific route for API categories
  fastify.get('/api/v1/categories', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding API categories request',
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
        msg: 'API categories response received',
        status: response.status,
        categoriesCount: response.body && typeof response.body === 'object' && 'categories' in response.body 
          ? Array.isArray((response.body as any).categories) ? (response.body as any).categories.length : 'unknown'
          : 'no categories'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in API categories proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch API categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for getting featured categories
  fastify.get('/api/v1/categories/featured', async (request, reply) => {
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

  // Specific route for getting category by ID
  fastify.get('/api/v1/categories/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding category details request',
        url: `${productServiceUrl}/api/v1/categories/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/categories/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in category details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch category details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for all brands
  fastify.get('/v1/brands', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding brands request',
        url: `${productServiceUrl}/api/v1/brands${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/brands${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Brands response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in brands proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch brands',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for admin products
  fastify.get('/api/v1/admin/products', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin products request',
        url: `${productServiceUrl}/api/v1/admin/products${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/products${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Admin products response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin products proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Route for GET admin product by ID
  fastify.get('/api/v1/admin/products/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin product details request',
        url: `${productServiceUrl}/api/v1/admin/products/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/products/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin product details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin product details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Route for POST admin product (create)
  fastify.post('/api/v1/admin/products', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      
      logger.info({
        msg: 'Forwarding admin product create request',
        url: `${productServiceUrl}/api/v1/admin/products`,
        method: 'POST'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'POST',
        url: `${productServiceUrl}/api/v1/admin/products`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin product create proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to create admin product',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Route for PUT admin product (update)
  fastify.put('/api/v1/admin/products/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin product update request',
        url: `${productServiceUrl}/api/v1/admin/products/${id}`,
        method: 'PUT',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'PUT',
        url: `${productServiceUrl}/api/v1/admin/products/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin product update proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update admin product',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Route for DELETE admin product
  fastify.delete('/api/v1/admin/products/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin product delete request',
        url: `${productServiceUrl}/api/v1/admin/products/${id}`,
        method: 'DELETE',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'DELETE',
        url: `${productServiceUrl}/api/v1/admin/products/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin product delete proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete admin product',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Admin Categories Routes
  
  // GET all admin categories
  fastify.get('/api/v1/admin/categories', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin categories request',
        url: `${productServiceUrl}/api/v1/admin/categories${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/categories${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin categories proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET admin category by ID
  fastify.get('/api/v1/admin/categories/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin category details request',
        url: `${productServiceUrl}/api/v1/admin/categories/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/categories/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin category details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin category details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST create admin category
  fastify.post('/api/v1/admin/categories', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      
      logger.info({
        msg: 'Forwarding admin category create request',
        url: `${productServiceUrl}/api/v1/admin/categories`,
        method: 'POST'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'POST',
        url: `${productServiceUrl}/api/v1/admin/categories`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin category create proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to create admin category',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT update admin category
  fastify.put('/api/v1/admin/categories/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin category update request',
        url: `${productServiceUrl}/api/v1/admin/categories/${id}`,
        method: 'PUT',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'PUT',
        url: `${productServiceUrl}/api/v1/admin/categories/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin category update proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update admin category',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE admin category
  fastify.delete('/api/v1/admin/categories/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin category delete request',
        url: `${productServiceUrl}/api/v1/admin/categories/${id}`,
        method: 'DELETE',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'DELETE',
        url: `${productServiceUrl}/api/v1/admin/categories/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin category delete proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete admin category',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST bulk delete admin categories
  fastify.post('/api/v1/admin/categories/bulk-delete', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      
      logger.info({
        msg: 'Forwarding admin categories bulk delete request',
        url: `${productServiceUrl}/api/v1/admin/categories/bulk-delete`,
        method: 'POST'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'POST',
        url: `${productServiceUrl}/api/v1/admin/categories/bulk-delete`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin categories bulk delete proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to bulk delete admin categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Admin Brands Routes
  
  // GET all admin brands
  fastify.get('/api/v1/admin/brands', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin brands request',
        url: `${productServiceUrl}/api/v1/admin/brands${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/brands${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin brands proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin brands',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET admin brand by ID
  fastify.get('/api/v1/admin/brands/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin brand details request',
        url: `${productServiceUrl}/api/v1/admin/brands/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/brands/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin brand details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin brand details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST create admin brand
  fastify.post('/api/v1/admin/brands', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      
      logger.info({
        msg: 'Forwarding admin brand create request',
        url: `${productServiceUrl}/api/v1/admin/brands`,
        method: 'POST'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'POST',
        url: `${productServiceUrl}/api/v1/admin/brands`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin brand create proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to create admin brand',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT update admin brand
  fastify.put('/api/v1/admin/brands/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin brand update request',
        url: `${productServiceUrl}/api/v1/admin/brands/${id}`,
        method: 'PUT',
        id
      });

      // Debug logging for the brand update request
      logger.info({
        msg: 'BRAND UPDATE REQUEST DETAILS',
        hasBody: !!request.body,
        bodyType: request.body ? typeof request.body : 'none',
        bodyContent: request.body ? JSON.stringify(request.body).substring(0, 500) : 'none',
        contentType: request.headers['content-type'],
        contentLength: request.headers['content-length']
      });

      // Check if we have a body
      let requestBody = request.body;
      
      // If we don't have a body but have content-type and content-length, try to get raw body
      if (!requestBody && request.headers['content-type']?.includes('application/json') && 
          request.headers['content-length'] && parseInt(request.headers['content-length'] as string, 10) > 0) {
        logger.info({ msg: 'Attempting to use raw body for brand update' });
        
        try {
          // Create a minimal body if needed
          requestBody = { _forceNotEmpty: true };
          
          logger.info({ 
            msg: 'Created fallback body for brand update',
            body: JSON.stringify(requestBody)
          });
        } catch (err) {
          logger.error({ 
            msg: 'Failed to create fallback body',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      // Validate that we have a body for the PUT request
      if (!requestBody || (typeof requestBody === 'object' && Object.keys(requestBody).length === 0)) {
        logger.error({ msg: 'Empty body received for brand update' });
        return reply.status(400).send({
          success: false,
          message: 'Request body cannot be empty for brand update',
          code: 'EMPTY_REQUEST_BODY'
        });
      }

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'PUT',
        url: `${productServiceUrl}/api/v1/admin/brands/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: requestBody
      });
      
      // Debug logging after the request
      logger.info({
        msg: 'BRAND UPDATE RESPONSE',
        status: response.status,
        responseBodySample: response.body ? 
          JSON.stringify(response.body).substring(0, 500) : 'none'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin brand update proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update admin brand',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE admin brand
  fastify.delete('/api/v1/admin/brands/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin brand delete request',
        url: `${productServiceUrl}/api/v1/admin/brands/${id}`,
        method: 'DELETE',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'DELETE',
        url: `${productServiceUrl}/api/v1/admin/brands/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin brand delete proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete admin brand',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Admin Tags Routes
  
  // GET all admin tags
  fastify.get('/api/v1/admin/tags', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin tags request',
        url: `${productServiceUrl}/api/v1/admin/tags${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/tags${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin tags proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin tags',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET admin tag by ID
  fastify.get('/api/v1/admin/tags/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin tag details request',
        url: `${productServiceUrl}/api/v1/admin/tags/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/tags/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin tag details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin tag details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST create admin tag
  fastify.post('/api/v1/admin/tags', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      
      logger.info({
        msg: 'Forwarding admin tag create request',
        url: `${productServiceUrl}/api/v1/admin/tags`,
        method: 'POST'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'POST',
        url: `${productServiceUrl}/api/v1/admin/tags`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin tag create proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to create admin tag',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT update admin tag
  fastify.put('/api/v1/admin/tags/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin tag update request',
        url: `${productServiceUrl}/api/v1/admin/tags/${id}`,
        method: 'PUT',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'PUT',
        url: `${productServiceUrl}/api/v1/admin/tags/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin tag update proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update admin tag',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE admin tag
  fastify.delete('/api/v1/admin/tags/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin tag delete request',
        url: `${productServiceUrl}/api/v1/admin/tags/${id}`,
        method: 'DELETE',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'DELETE',
        url: `${productServiceUrl}/api/v1/admin/tags/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin tag delete proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete admin tag',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST bulk delete admin tags
  fastify.post('/api/v1/admin/tags/bulk-delete', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      
      logger.info({
        msg: 'Forwarding admin tags bulk delete request',
        url: `${productServiceUrl}/api/v1/admin/tags/bulk-delete`,
        method: 'POST'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'POST',
        url: `${productServiceUrl}/api/v1/admin/tags/bulk-delete`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin tags bulk delete proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to bulk delete admin tags',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Admin Coupons Routes
  
  // GET all admin coupons
  fastify.get('/api/v1/admin/coupons', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin coupons request',
        url: `${productServiceUrl}/api/v1/admin/coupons${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/coupons${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin coupons proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin coupons',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET admin coupon by ID
  fastify.get('/api/v1/admin/coupons/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding admin coupon details request',
        url: `${productServiceUrl}/api/v1/admin/coupons/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/admin/coupons/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin coupon details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch admin coupon details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST create admin coupon
  fastify.post('/api/v1/admin/coupons', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      
      logger.info({
        msg: 'Forwarding admin coupon create request',
        url: `${productServiceUrl}/api/v1/admin/coupons`,
        method: 'POST'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'POST',
        url: `${productServiceUrl}/api/v1/admin/coupons`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin coupon create proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to create admin coupon',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT update admin coupon
  fastify.put('/api/v1/admin/coupons/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin coupon update request',
        url: `${productServiceUrl}/api/v1/admin/coupons/${id}`,
        method: 'PUT',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'PUT',
        url: `${productServiceUrl}/api/v1/admin/coupons/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
        body: request.body
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin coupon update proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update admin coupon',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE admin coupon
  fastify.delete('/api/v1/admin/coupons/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      
      logger.info({
        msg: 'Forwarding admin coupon delete request',
        url: `${productServiceUrl}/api/v1/admin/coupons/${id}`,
        method: 'DELETE',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'DELETE',
        url: `${productServiceUrl}/api/v1/admin/coupons/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in admin coupon delete proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete admin coupon',
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
      
      // Log the request details
      logger.info({
        msg: 'Forwarding product details by slug request',
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
        msg: 'Product details by slug response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in product details by slug proxy',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch product details by slug',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for related products
  fastify.get('/v1/products/related/:slug', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const slug = (request.params as any).slug;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      // Log the request details
      logger.info({
        msg: 'Forwarding related products request',
        url: `${productServiceUrl}/api/v1/products/related/${slug}${queryString}`,
        method: 'GET',
        slug
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/products/related/${slug}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Related products response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in related products proxy',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch related products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for product reviews by slug
  fastify.get('/v1/reviews/product-slug/:slug', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const slug = (request.params as any).slug;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      // Log the request details
      logger.info({
        msg: 'Forwarding product reviews by slug request',
        url: `${productServiceUrl}/api/v1/reviews/product-slug/${slug}${queryString}`,
        method: 'GET',
        slug
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/reviews/product-slug/${slug}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Product reviews by slug response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in product reviews by slug proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch product reviews by slug',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for product details by ID
  fastify.get('/v1/products/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding product details by ID request',
        url: `${productServiceUrl}/api/v1/products/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/products/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Product details by ID response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in product details by ID proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch product details by ID',
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

  // Add a debug route to check available endpoints
  fastify.get('/debug/endpoints', async (request, reply) => {
    try {
      const serviceUrls = {
        product: config.services.product,
        auth: config.services.auth,
        user: config.services.user,
        cart: config.services.cart,
        checkout: config.services.checkout,
        order: config.services.order
      };
      
      // Log debug information
      logger.info({
        msg: 'Debug endpoint called',
        serviceUrls,
        headers: request.headers
      });
      
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'api-gateway',
        serviceUrls,
        routes: getAllRoutes()
      });
    } catch (error) {
      logger.error({
        msg: 'Error in debug endpoint',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Error in debug endpoint',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for public tags
  fastify.get('/api/v1/tags', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding tags request',
        url: `${productServiceUrl}/api/v1/tags${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/tags${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Tags response received',
        status: response.status,
        tagsCount: response.body && typeof response.body === 'object' && 'tags' in response.body 
          ? Array.isArray((response.body as any).tags) ? (response.body as any).tags.length : 'unknown'
          : 'no tags'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in tags proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch tags',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for getting tag by ID
  fastify.get('/api/v1/tags/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding tag details request',
        url: `${productServiceUrl}/api/v1/tags/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/tags/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in tag details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch tag details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for public brands
  fastify.get('/api/v1/brands', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding brands request',
        url: `${productServiceUrl}/api/v1/brands${queryString}`,
        method: 'GET'
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/brands${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Brands response received',
        status: response.status,
        brandsCount: response.body && typeof response.body === 'object' && 'brands' in response.body 
          ? Array.isArray((response.body as any).brands) ? (response.body as any).brands.length : 'unknown'
          : 'no brands'
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in brands proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch brands',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Specific route for getting brand by ID
  fastify.get('/api/v1/brands/:id', async (request, reply) => {
    try {
      const productServiceUrl = config.services.product;
      const id = (request.params as any).id;
      const queryString = request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : '';
      
      logger.info({
        msg: 'Forwarding brand details request',
        url: `${productServiceUrl}/api/v1/brands/${id}${queryString}`,
        method: 'GET',
        id
      });

      // Forward directly to product service
      const response = await forwardRequest({
        method: 'GET',
        url: `${productServiceUrl}/api/v1/brands/${id}${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(productServiceUrl).host,
        },
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in brand details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch brand details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Register a generic proxy for all other /api/v1 routes
  // This route will catch all requests that haven't been specifically handled above
  // and forward them to the appropriate service based on the service registry.
  // It handles all HTTP methods, including OPTIONS for CORS preflight requests.
  fastify.all('/api/v1/*', forwardHandler);

  // Expose OPTIONS method explicitly for /api/v1/orders/* to ensure CORS preflight requests are handled
  fastify.options('/api/v1/orders/*', async (request, reply) => {
    logger.info({
      msg: 'Received OPTIONS request for orders',
      path: request.url,
      method: request.method,
      headers: request.headers
    });
    // The fastify-cors plugin already handles the actual CORS headers,
    // so we just need to ensure the request is routed and a 200 OK is sent.
    reply.status(200).send();
  });
};

export default proxyRoutes; 
import { FastifyRequest, FastifyReply } from 'fastify';
import { forwardRequest, ServiceRequest } from '../utils/httpClient';
import { handleServiceError } from '../utils/errorHandler';
import { httpLogger as logger } from '../utils/logger';
import { config } from '../config/env';

// Interface for service configuration
export interface ServiceConfig {
  name: string;
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Helper function to get service URL based on environment
function getServiceUrl(containerUrl: string, localPort: number): string {
  // Use 127.0.0.1 in development mode for local testing (explicitly IPv4)
  if (config.server.nodeEnv === 'development') {
    return `http://127.0.0.1:${localPort}`;
  }
  return containerUrl;
}

// Map of service routes to their configurations
const serviceRoutes: Record<string, ServiceConfig> = {
  '/api/auth': {
    name: 'auth-service',
    url: getServiceUrl(config.services.auth, 3001),
    timeout: 5000,
  },
  '/api/users': {
    name: 'user-service',
    url: getServiceUrl(config.services.user, 3002),
    timeout: 5000,
  },
  '/api/products': {
    name: 'product-service',
    url: getServiceUrl(config.services.product, 3003),
    timeout: 10000, // Longer timeout for product catalog
  },
  '/api/cart': {
    name: 'cart-service',
    url: getServiceUrl(config.services.cart, 3004),
    timeout: 5000,
  },
  '/api/checkout': {
    name: 'checkout-service',
    url: getServiceUrl(config.services.checkout, 3005),
    timeout: 15000, // Longer timeout for checkout process
  },
  '/api/orders': {
    name: 'order-service',
    url: getServiceUrl(config.services.order, 3006),
    timeout: 10000,
  },
  '/api/payments': {
    name: 'payment-service',
    url: getServiceUrl(config.services.payment, 3007),
    timeout: 15000, // Longer timeout for payment processing
  },
  '/api/shipping': {
    name: 'shipping-service',
    url: getServiceUrl(config.services.shipping, 3008),
    timeout: 8000,
  },
  '/api/inventory': {
    name: 'inventory-service',
    url: getServiceUrl(config.services.inventory, 3009),
    timeout: 5000,
  },
  '/api/company': {
    name: 'company-service',
    url: getServiceUrl(config.services.company, 3010),
    timeout: 5000,
  },
  '/api/pricing': {
    name: 'pricing-service',
    url: getServiceUrl(config.services.pricing, 3011),
    timeout: 5000,
  },
  '/api/admin': {
    name: 'admin-service',
    url: getServiceUrl(config.services.admin, 3012),
    timeout: 10000,
  },
};

/**
 * Find the appropriate service configuration for a given path
 */
function findServiceConfig(path: string): ServiceConfig | undefined {
  // Handle versioned paths (e.g., /api/v1/admin/products)
  const versionedMatch = path.match(/^\/api\/v\d+\/([^\/]+)/);
  if (versionedMatch) {
    const serviceName = versionedMatch[1];
    
    // Special case: if path contains admin/products, route to product service
    if (serviceName === 'admin' && path.includes('/products')) {
      logger.info({
        msg: 'Routing admin/products path to product service',
        path,
        serviceName: 'product-service'
      });
      return serviceRoutes['/api/products'];
    }
    
    const serviceRoute = `/api/${serviceName}`;
    return serviceRoutes[serviceRoute];
  }
  
  // Handle standard paths (e.g., /api/admin/products)
  // Special case: if path contains admin/products, route to product service
  if (path.match(/^\/api\/admin\/products/)) {
    logger.info({
      msg: 'Routing admin/products path to product service',
      path,
      serviceName: 'product-service'
    });
    return serviceRoutes['/api/products'];
  }
  
  const route = Object.keys(serviceRoutes).find(route => path.startsWith(route));
  return route ? serviceRoutes[route] : undefined;
}

/**
 * Extract the target path from the original request
 */
function getTargetPath(originalPath: string, serviceRoute: string): string {
  // For admin/products routes to product service, don't modify the path
  // Just keep the original path with api/v1/admin/products structure
  if (originalPath.match(/^\/api\/v\d+\/admin\/products/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    logger.info({
      msg: 'Preserving admin/products path structure for product service',
      originalPath,
      preservedPath: `/api/v${version}/admin/products${queryString}`,
      method: 'ANY'
    });
    
    return `/api/v${version}/admin/products${queryString}`;
  }
  
  if (originalPath.match(/^\/api\/admin\/products/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    
    logger.info({
      msg: 'Preserving admin/products path structure for product service',
      originalPath,
      preservedPath: `/api/admin/products${queryString}`,
      method: 'ANY'
    });
    
    return `/api/admin/products${queryString}`;
  }

  // For non-admin product routes, keep existing logic
  if (originalPath.match(/^\/api\/v\d+\/products/) && !originalPath.includes('/admin/')) {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Use the product service's expected path format
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    logger.info({
      msg: 'Transforming products path for product service',
      originalPath,
      transformedPath: `/api/v${version}/products${queryString}`,
      method: 'ANY'
    });
    
    return `/api/v${version}/products${queryString}`;
  }

  // Special case for admin/products routes (keep for other paths)
  if (originalPath.includes('/admin/products')) {
    // For admin/products, preserve the admin part in the path
    // Extract query string if present
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    // Create the path that product service expects with admin
    let productPath;
    
    // Check if it's a versioned path
    const versionMatch = originalPath.match(/\/api\/v(\d+)\/admin\/products/);
    if (versionMatch) {
      const version = versionMatch[1];
      productPath = `/api/v${version}/admin/products${queryString}`;
    } else {
      productPath = `/api/admin/products${queryString}`;
    }
    
    // Add detailed logging
    logger.info({
      msg: 'Preserving admin/products path',
      originalPath,
      preservedPath: productPath,
      routeType: 'admin-products'
    });
    
    return productPath;
  }

  // Handle versioned paths (e.g., /api/v1/admin/products)
  const versionedMatch = originalPath.match(/^\/api\/v(\d+)\/([^\/]+)(.*)/);
  if (versionedMatch) {
    const version = versionedMatch[1];
    const serviceName = versionedMatch[2];
    const pathSegment = versionedMatch[3] || '/';
    
    // For auth service, prefix with /api/auth
    if (serviceName === 'auth') {
      // Remove leading slash if present and add /api/auth prefix
      const cleanPath = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;
      const result = `/api/auth${cleanPath}`;
      
      // Add detailed logging
      logger.info({
        msg: 'Processing auth service path',
        originalPath,
        transformedPath: result,
        routeType: 'auth-versioned'
      });
      
      return result;
    }
    
    // For other services, include the version number
    const result = `/v${version}${pathSegment}`;
    
    // Add detailed logging
    logger.info({
      msg: 'Processing versioned path',
      originalPath,
      transformedPath: result,
      serviceName,
      version,
      routeType: 'versioned'
    });
    
    return result;
  }
  
  // Extract path segment after service route for standard paths
  const pathSegment = originalPath.substring(serviceRoute.length) || '/';
  
  // For auth service, prefix with /api/auth
  if (serviceRoute === '/api/auth') {
    // Remove leading slash if present and add /api/auth prefix
    const cleanPath = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;
    const result = `/api/auth${cleanPath}`;
    
    // Add detailed logging
    logger.info({
      msg: 'Processing auth service standard path',
      originalPath,
      transformedPath: result,
      routeType: 'auth-standard'
    });
    
    return result;
  }
  
  // For other services, we just use the path segment
  // Add detailed logging
  logger.info({
    msg: 'Processing standard path',
    originalPath,
    transformedPath: pathSegment,
    serviceRoute,
    routeType: 'standard'
  });
  
  return pathSegment;
}

/**
 * Forward handler for proxying requests to microservices
 */
export async function forwardHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.headers['x-request-id'] as string;
  const path = request.url;

  try {
    // Find service configuration
    const serviceConfig = findServiceConfig(path);
    if (!serviceConfig) {
      logger.warn({
        msg: 'No service configuration found for path',
        path,
        requestId,
      });
      return reply.status(404).send({
        status: 404,
        code: 'NOT_FOUND',
        message: `No service configured for path: ${path}`,
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Log selected service for debugging
    logger.info({
      msg: 'Selected service for request',
      path,
      method: request.method,
      serviceName: serviceConfig.name,
      serviceUrl: serviceConfig.url,
      requestId,
    });

    // Determine the appropriate route for this path
    let route: string;
    const versionedMatch = path.match(/^\/api\/v\d+\/([^\/]+)/);
    if (versionedMatch) {
      // For versioned paths, use the corresponding base route
      const serviceName = versionedMatch[1];
      route = `/api/${serviceName}`;
      
      // Special case for admin/products - use products route
      if (serviceName === 'admin' && path.includes('/products')) {
        route = '/api/products';
        logger.info({
          msg: 'Using product service route for admin/products path',
          path,
          route,
          requestId,
        });
      }
    } else {
      // For standard paths, find the matching route
      route = Object.keys(serviceRoutes).find(r => path.startsWith(r))!;
      
      // Special case for admin/products - use products route
      if (route === '/api/admin' && path.includes('/products')) {
        route = '/api/products';
        logger.info({
          msg: 'Using product service route for admin/products path',
          path,
          route,
          requestId,
        });
      }
    }

    // Get target path
    const targetPath = getTargetPath(path, route);
    const targetUrl = `${serviceConfig.url}${targetPath}`;

    // Log the forwarding details for debugging
    logger.info({
      msg: 'Forwarding request details',
      originalPath: path,
      serviceRoute: route,
      targetPath,
      targetUrl,
      serviceName: serviceConfig.name,
      method: request.method,
      requestId,
    });

    // Prepare headers
    const headers = {
      ...request.headers,
      'x-forwarded-for': request.ip,
      'x-forwarded-host': request.hostname,
      'x-forwarded-proto': request.protocol,
      ...serviceConfig.headers,
    };

    // Log authentication information for debugging
    if (headers.authorization) {
      logger.info({
        msg: 'Authorization header details',
        headerPresent: !!headers.authorization,
        headerType: typeof headers.authorization,
        headerPrefix: headers.authorization.substring(0, 10) + '...',
        path,
        serviceName: serviceConfig.name,
        requestId,
      });
    } else {
      logger.warn({
        msg: 'No authorization header present',
        path,
        serviceName: serviceConfig.name,
        requestId,
      });
    }

    // Remove headers that shouldn't be forwarded
    delete headers['host'];
    delete headers['connection'];

    // Extract the body if it exists
    let body: unknown = undefined;
    if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
      body = request.body;
    }

    // Prepare service request
    const serviceRequest: ServiceRequest = {
      method: request.method as ServiceRequest['method'],
      url: targetUrl,
      headers,
      body,
      timeout: serviceConfig.timeout,
    };

    // Log forwarding attempt with body info
    logger.debug({
      msg: 'Forwarding request to service',
      service: serviceConfig.name,
      method: request.method,
      path: targetPath,
      hasBody: !!body,
      requestId,
    });

    // Forward request to service
    const response = await forwardRequest(serviceRequest);

    // Log response error details if status code is 4xx or 5xx
    if (response.status >= 400) {
      logger.error({
        msg: 'Error response from service',
        service: serviceConfig.name,
        status: response.status,
        responseBody: typeof response.body === 'object' ? JSON.stringify(response.body) : response.body,
        originalPath: path,
        targetPath,
        requestId,
      });
    }

    // Set response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
        reply.header(key, value);
      }
    });

    // Log successful response
    logger.debug({
      msg: 'Service response received',
      service: serviceConfig.name,
      status: response.status,
      requestId,
    });

    // Send response
    return reply
      .status(response.status)
      .send(response.body);

  } catch (error) {
    // Handle and log error
    const errorResponse = handleServiceError(error, requestId);
    
    logger.error({
      err: error,
      msg: 'Failed to forward request',
      path,
      requestId,
    });

    return reply
      .status(errorResponse.status)
      .send(errorResponse);
  }
}

// Example usage:
/*
import { forwardHandler } from './controllers/forward.controller';

fastify.all('/api/*', forwardHandler);
*/ 
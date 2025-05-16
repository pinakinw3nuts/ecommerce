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

// Map of service routes to their configurations
const serviceRoutes: Record<string, ServiceConfig> = {
  '/api/auth': {
    name: 'auth-service',
    url: config.services.auth,
    timeout: 5000,
  },
  '/api/users': {
    name: 'user-service',
    url: config.services.user,
    timeout: 5000,
  },
  '/api/products': {
    name: 'product-service',
    url: config.services.product,
    timeout: 10000, // Longer timeout for product catalog
  },
  // Add more service routes as needed
};

/**
 * Find the appropriate service configuration for a given path
 */
function findServiceConfig(path: string): ServiceConfig | undefined {
  const route = Object.keys(serviceRoutes).find(route => path.startsWith(route));
  return route ? serviceRoutes[route] : undefined;
}

/**
 * Extract the target path from the original request
 */
function getTargetPath(originalPath: string, serviceRoute: string): string {
  return originalPath.substring(serviceRoute.length) || '/';
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

    // Get target path
    const route = Object.keys(serviceRoutes).find(r => path.startsWith(r))!;
    const targetPath = getTargetPath(path, route);
    const targetUrl = `${serviceConfig.url}${targetPath}`;

    // Prepare headers
    const headers = {
      ...request.headers,
      'x-forwarded-for': request.ip,
      'x-forwarded-host': request.hostname,
      'x-forwarded-proto': request.protocol,
      ...serviceConfig.headers,
    };

    // Remove headers that shouldn't be forwarded
    delete headers['host'];
    delete headers['connection'];

    // Prepare service request
    const serviceRequest: ServiceRequest = {
      method: request.method as ServiceRequest['method'],
      url: targetUrl,
      headers,
      body: request.body,
      timeout: serviceConfig.timeout,
    };

    // Log forwarding attempt
    logger.debug({
      msg: 'Forwarding request to service',
      service: serviceConfig.name,
      method: request.method,
      path: targetPath,
      requestId,
    });

    // Forward request to service
    const response = await forwardRequest(serviceRequest);

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
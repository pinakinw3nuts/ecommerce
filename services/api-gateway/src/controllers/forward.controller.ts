import { FastifyRequest, FastifyReply } from 'fastify';
import { forwardRequest, ServiceRequest } from '../utils/httpClient';
import { handleServiceError } from '../utils/errorHandler';
import { httpLogger as logger } from '../utils/logger';
import { findServiceForPath, getTargetPath } from '../config/serviceRegistry';

/**
 * Forward handler for all API requests
 * This is a unified handler that dynamically routes requests to the appropriate service
 */
export async function forwardHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const path = request.url;
  const requestId = request.headers['x-request-id'] as string;

  try {
    // Add debug logging for path
    logger.debug({
      msg: 'Attempting to find service for path',
      path,
      requestId,
    });

    // Find the appropriate service for this path
    const serviceConfig = findServiceForPath(path);

    if (!serviceConfig) {
      logger.warn({
        msg: 'No service found for path',
        path,
        requestId,
      });

      return reply.status(404).send({
        status: 404,
        code: 'NOT_FOUND',
        message: 'No service configured for this path',
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Get target path for the downstream service
    const targetPath = getTargetPath(path);
    const targetUrl = `${serviceConfig.url}${targetPath}`;

    // Log the forwarding details
    logger.info({
      msg: 'Forwarding request',
      originalPath: path,
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

    // Remove headers that shouldn't be forwarded
    delete headers['host'];
    delete headers['connection'];
    delete headers['transfer-encoding'];

    // Extract the body if it exists
    let body: unknown = undefined;
    if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
      body = request.body;
    }

    // Forward request to the service
    const serviceRequest: ServiceRequest = {
      method: request.method as ServiceRequest['method'],
      url: targetUrl,
      headers,
      body,
      timeout: serviceConfig.timeout,
    };

    // Forward the request and get the response
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
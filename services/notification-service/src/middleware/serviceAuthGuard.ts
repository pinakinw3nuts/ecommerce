import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { config } from '../config';
import { User } from '../types/fastify';

/**
 * Authentication middleware specifically for service-to-service communication
 * This allows other internal services to call the notification service
 * without requiring full JWT authentication
 */
export async function serviceAuthGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    const serviceToken = request.headers['x-service-token'] as string;
    
    // If no service token is provided, continue to the next authentication method
    if (!serviceToken) {
      return;
    }
    
    // Verify the service token against our configured service tokens
    // In a production environment, these would be strong, unique tokens
    // stored securely in environment variables
    const validServiceTokens = config.serviceTokens || [];
    
    if (!validServiceTokens.includes(serviceToken)) {
      logger.warn('Invalid service token', {
        url: request.url,
        method: request.method,
        serviceToken: serviceToken ? '****' + serviceToken.substring(serviceToken.length - 4) : null
      });
      
      return reply.status(401).send({
        message: 'Invalid service token',
        error: 'INVALID_SERVICE_TOKEN'
      });
    }
    
    // Set user information for service account
    // This allows the service to be identified in logs and for authorization checks
    request.user = {
      id: 'service-account',
      roles: ['service'],
      name: request.headers['x-service-name'] as string || 'unknown-service'
    };
    
    logger.debug('Service authenticated', {
      serviceName: request.user.name,
      url: request.url,
      method: request.method
    });
    
    // Continue to route handler
  } catch (error) {
    logger.error('Service authentication error', {
      url: request.url,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Pass to the next authentication method or return error
    return reply.status(500).send({
      message: 'Service authentication error',
      error: 'SERVICE_AUTH_ERROR'
    });
  }
} 
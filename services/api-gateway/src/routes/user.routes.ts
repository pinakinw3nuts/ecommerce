import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { httpLogger as logger } from '../utils/logger';
import { forwardRequest } from '../utils/httpClient';
import { config } from '../config/env';
import { services } from '../config/serviceRegistry';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

const userRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Helper function to forward requests to user service
  const forwardToUserService = async (request: any, reply: any, endpoint: string, method: HttpMethod) => {
    try {
      const cleanHeaders = { ...request.headers };
      delete cleanHeaders['expect'];
      delete cleanHeaders['connection'];
      delete cleanHeaders['host'];
      delete cleanHeaders['content-length'];

      const userServiceUrl = services['user']?.url || config.services.user;
      const targetUrl = `${userServiceUrl}/api/v1/${endpoint}`;

      logger.info({
        msg: `Proxying ${method} /${endpoint} to user service`,
        targetUrl,
        requestId: request.headers['x-request-id'],
      });

      const response = await forwardRequest({
        method,
        url: targetUrl,
        headers: cleanHeaders as Record<string, string | string[] | undefined>,
        body: method !== 'GET' ? request.body : undefined,
      });

      // Set response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
          reply.header(key, value);
        }
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        err: error,
        msg: `Error proxying ${method} /${endpoint}`,
        requestId: request.headers['x-request-id'],
      });
      return reply.status(500).send({
        status: 'error',
        message: 'User service unavailable',
      });
    }
  };

  // Single route for GET user profile
  fastify.get('/v1/user/me', async (request, reply) => {
    return forwardToUserService(request, reply, 'user/me', 'GET');
  });

  // Single route for PATCH user profile
  fastify.patch('/v1/user/me', async (request, reply) => {
    return forwardToUserService(request, reply, 'user/me', 'PATCH');
  });

  // Handle OPTIONS requests for CORS preflight
  fastify.options('/v1/user/me', async (request, reply) => {
    return forwardToUserService(request, reply, 'user/me', 'OPTIONS');
  });

  // Redirect old routes to the new one
  fastify.get('/users/me', (_, reply) => {
    return reply.redirect(301, '/api/v1/user/me');
  });
  
  fastify.get('/me', (_, reply) => {
    return reply.redirect(301, '/api/v1/user/me');
  });
  
  fastify.patch('/users/me', (_, reply) => {
    return reply.redirect(307, '/api/v1/user/me');
  });
  
  fastify.patch('/me', (_, reply) => {
    return reply.redirect(307, '/api/v1/user/me');
  });

  // Handle OPTIONS requests for old routes
  fastify.options('/users/me', (_, reply) => {
    return reply.header('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS')
                .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                .send();
  });

  fastify.options('/me', (_, reply) => {
    return reply.header('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS')
                .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                .send();
  });

  // Proxy POST /users (registration)
  fastify.post('/users', async (request, reply) => {
    return forwardToUserService(request, reply, 'users', 'POST');
  });

  // Log registered routes
  logger.info('User routes registered', {
    routes: [
      'GET /v1/user/me',
      'PATCH /v1/user/me',
      'POST /users'
    ]
  });
};

export default userRoutes; 
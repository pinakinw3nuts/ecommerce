import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { httpLogger as logger } from '../../utils/logger';
import { forwardRequest } from '../../utils/httpClient';
import { config } from '../../config/env';
import { services } from '../../config/serviceRegistry';

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Add a debug log when auth routes are registered
  logger.info('Registering auth routes');
  
  // Log the auth service URL from both config and service registry
  logger.info({
    msg: 'Auth service URLs',
    configUrl: config.services.auth,
    serviceRegistryUrl: services['auth']?.url || 'not configured',
    nodeEnv: config.server.nodeEnv
  });

  // Proxy health check endpoint for auth service
  fastify.get('/health', async (request, reply) => {
    try {
      const authServiceUrl = services['auth']?.url || config.services.auth;
      const targetUrl = `${authServiceUrl}/health`;
      logger.info({
        msg: 'Proxying health check to auth service',
        targetUrl,
        requestId: request.headers['x-request-id'],
      });
      const response = await forwardRequest({
        method: 'GET',
        url: targetUrl,
        headers: request.headers as Record<string, string | string[] | undefined>,
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
        msg: 'Error proxying health check to auth service',
        requestId: request.headers['x-request-id'],
      });
      return reply.status(503).send({
        status: 'unhealthy',
        message: 'Auth service health check failed',
      });
    }
  });

  // Health check endpoint for auth service
  fastify.get('/ping', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            service: { type: 'string' },
          },
        },
      },
    },
    handler: async (request) => {
      logger.debug({
        msg: 'Auth service ping requested',
        requestId: request.headers['x-request-id'],
      });

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'auth',
      };
    },
  });

  // Login route with validation
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        logger.info({
          msg: 'Auth login route called',
          path: request.url,
          method: request.method,
          requestId: request.headers['x-request-id'],
        });

        // Clean headers
        const cleanHeaders = { ...request.headers };
        delete cleanHeaders['expect'];
        delete cleanHeaders['connection'];
        delete cleanHeaders['host'];
        delete cleanHeaders['content-length'];

        // Add CORS headers
        reply.header('Access-Control-Allow-Credentials', 'true');
        reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
        reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        const authServiceUrl = services['auth']?.url || config.services.auth;
        const targetUrl = `${authServiceUrl}/api/auth/login`;

        const response = await forwardRequest({
          method: 'POST',
          url: targetUrl,
          headers: {
            ...cleanHeaders,
            'Content-Type': 'application/json'
          } as Record<string, string | string[] | undefined>,
          body: request.body,
        });

        // Handle different response statuses
        switch (response.status) {
          case 200:
            // Set auth cookies if login successful
            if ((response.body as any)?.accessToken) {
              reply.setCookie('access_token', (response.body as any).accessToken, {
                httpOnly: true,
                secure: config.server.nodeEnv === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 // 24 hours
              });
            }
            if ((response.body as any)?.refreshToken) {
              reply.setCookie('refresh_token', (response.body as any).refreshToken, {
                httpOnly: true,
                secure: config.server.nodeEnv === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 // 7 days
              });
            }
            break;
          case 401:
            return reply.status(401).send({
              status: 'error',
              message: 'Invalid credentials'
            });
          case 400:
            return reply.status(400).send({
              status: 'error',
              message: 'Invalid request'
            });
          default:
            if (response.status >= 500) {
              return reply.status(503).send({
                status: 'error',
                message: 'Authentication service unavailable'
              });
            }
        }

        return reply.status(response.status).send(response.body);
      } catch (error) {
        logger.error({
          err: error,
          msg: 'Error forwarding login request',
          requestId: request.headers['x-request-id'],
        });
        return reply.status(500).send({
          status: 'error',
          message: 'Internal server error'
        });
      }
    }
  });

  // Options route for CORS preflight requests
  fastify.options('/login', async (request, reply) => {
    reply.header('Access-Control-Allow-Credentials', 'true');
    reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
    reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return reply.status(204).send();
  });

  // Apply the same header cleaning to all other routes
  const cleanAndForwardRequest = async (request: any, reply: any, endpoint: string, methodName: string) => {
    try {
      // Clean headers - remove problematic headers
      const cleanHeaders = { ...request.headers };
      delete cleanHeaders['expect'];
      delete cleanHeaders['connection'];
      delete cleanHeaders['host'];
      delete cleanHeaders['content-length'];

      const authServiceUrl = services['auth']?.url || config.services.auth;

      logger.debug({
        msg: `Forwarding ${methodName} request to auth service`,
        requestId: request.headers['x-request-id'],
      });

      const response = await forwardRequest({
        method: 'POST',
        url: `${authServiceUrl}/api/auth/${endpoint}`,
        headers: cleanHeaders as Record<string, string | string[] | undefined>,
        body: request.body,
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        err: error,
        msg: `Error forwarding ${methodName} request`,
        requestId: request.headers['x-request-id'],
      });
      return reply.status(500).send({
        status: 'error',
        message: 'Authentication service unavailable',
      });
    }
  };

  // Signup route (was /register)
  fastify.post('/signup', async (request, reply) => {
    return cleanAndForwardRequest(request, reply, 'signup', 'signup');
  });

  // Refresh token route
  fastify.post('/refresh', async (request, reply) => {
    return cleanAndForwardRequest(request, reply, 'refresh-token', 'refresh token');
  });

  // Admin login route
  fastify.post('/admin/login', async (request, reply) => {
    return cleanAndForwardRequest(request, reply, 'admin/login', 'admin login');
  });

  // Google login route
  fastify.post('/google-login', async (request, reply) => {
    return cleanAndForwardRequest(request, reply, 'google-login', 'Google login');
  });
};

export default authRoutes; 
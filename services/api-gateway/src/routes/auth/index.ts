import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { httpLogger as logger } from '../../utils/logger';

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
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

  // Additional auth routes will be added here
  // POST /login
  // POST /register
  // POST /refresh-token
  // etc...
};

export default authRoutes; 
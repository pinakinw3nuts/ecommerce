import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { config } from '../config/env';
import { httpLogger as logger } from '../utils/logger';

const rootRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            environment: { type: 'string' },
            description: { type: 'string' },
            endpoints: {
              type: 'object',
              properties: {
                api: {
                  type: 'object',
                  properties: {
                    auth: { type: 'string' },
                    users: { type: 'string' },
                    products: { type: 'string' },
                  },
                },
                health: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    details: { type: 'string' },
                  },
                },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      logger.debug('Root endpoint accessed');

      return reply.send({
        name: 'E-Commerce API Gateway',
        version: config.server.version,
        environment: config.server.nodeEnv,
        description: 'API Gateway service for the E-Commerce microservices platform',
        endpoints: {
          api: {
            auth: '/api/auth/* - Authentication and authorization services',
            users: '/api/users/* - User management services',
            products: '/api/products/* - Product catalog services',
          },
          health: {
            status: '/health - Basic health check endpoint',
            details: '/health/details - Detailed health status with metrics',
          },
        },
        timestamp: new Date().toISOString(),
      });
    },
  });
};

export default rootRoutes; 
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { HealthController } from '@controllers/health.controller';

/**
 * Health check routes
 */
export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Basic health check
  fastify.get('/health', {
    schema: {
      description: 'Get basic health status',
      tags: ['Health'],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['connected', 'disconnected'] },
                type: { type: 'string' }
              }
            },
            rates: {
              type: 'object',
              properties: {
                lastSync: { type: 'string' },
                default_currency: { type: 'string' }
              }
            },
            environment: { type: 'string' },
            version: { type: 'string' }
          }
        },
        503: {
          description: 'Service unavailable',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['degraded', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: HealthController.getHealth
  });

  // Detailed health check
  fastify.get('/health/details', {
    schema: {
      description: 'Get detailed health status with metrics',
      tags: ['Health'],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['connected', 'disconnected'] },
                type: { type: 'string' },
                initialized: { type: 'boolean' },
                migrations: { type: 'number' }
              }
            },
            rates: {
              type: 'object',
              properties: {
                lastSync: { type: 'string' },
                default_currency: { type: 'string' },
                timeSinceLastSync: { type: ['number', 'null'] }
              }
            },
            system: {
              type: 'object',
              properties: {
                uptime: { type: 'string' },
                uptimeSeconds: { type: 'number' },
                memory: {
                  type: 'object',
                  properties: {
                    rss: { type: 'string' },
                    heapTotal: { type: 'string' },
                    heapUsed: { type: 'string' },
                    external: { type: 'string' }
                  }
                },
                node: { type: 'string' },
                platform: { type: 'string' },
                arch: { type: 'string' }
              }
            },
            environment: { type: 'string' },
            version: { type: 'string' }
          }
        },
        503: {
          description: 'Service unavailable',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['degraded', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: HealthController.getDetailedHealth
  });
}; 
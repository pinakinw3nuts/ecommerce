import { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/health.controller';
import { apiLogger } from '../utils/logger';

/**
 * Health check routes plugin
 * Registers health check endpoints
 */
export async function healthRoutes(fastify: FastifyInstance) {
  const healthController = new HealthController();

  // Log route registration
  apiLogger.info('Registering health check routes');

  // Health check endpoint
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health Check',
      description: 'Check the health of the service, including database connection and uptime',
      response: {
        200: {
          description: 'Service is healthy',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            database: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                healthy: { type: 'boolean' }
              }
            },
            service: {
              type: 'object',
              properties: {
                uptime: { type: 'number' },
                formattedUptime: { type: 'string' }
              }
            }
          }
        },
        503: {
          description: 'Service is unhealthy',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            database: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                healthy: { type: 'boolean' }
              }
            },
            service: {
              type: 'object',
              properties: {
                uptime: { type: 'number' },
                formattedUptime: { type: 'string' }
              }
            }
          }
        },
        500: {
          description: 'Error checking service health',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['error'] },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    handler: healthController.getHealth.bind(healthController)
  });
} 
import { FastifyInstance } from 'fastify';
import { HealthController } from '@controllers/health.controller';

// Initialize controller
const healthController = new HealthController();

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check endpoint - no auth required
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Check service health',
      description: 'Checks the service health including database connection',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            service: { type: 'string' },
            database: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' }
              }
            },
            uptime: { type: 'number' }
          }
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            service: { type: 'string' },
            database: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                error: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, healthController.check);
} 
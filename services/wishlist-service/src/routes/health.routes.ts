import { FastifyInstance } from 'fastify';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Health check routes
 * @param fastify - The Fastify instance
 */
export async function healthRoutes(fastify: FastifyInstance) {
  // Service start time for uptime calculation
  const startTime = Date.now();

  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                connected: { type: 'boolean' }
              }
            },
            service: {
              type: 'object',
              properties: {
                name: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async (_, reply) => {
      const now = new Date();
      const uptimeMs = Date.now() - startTime;
      
      // Check database connection
      let dbStatus = 'disconnected';
      let dbConnected = false;
      
      try {
        if (AppDataSource.isInitialized) {
          // Try to ping the database
          await AppDataSource.query('SELECT 1');
          dbStatus = 'connected';
          dbConnected = true;
        }
      } catch (error) {
        logger.error({ error }, 'Database health check failed');
        dbStatus = 'error';
      }
      
      reply.status(dbConnected ? 200 : 503).send({
        status: dbConnected ? 'healthy' : 'unhealthy',
        timestamp: now.toISOString(),
        uptime: uptimeMs,
        database: {
          status: dbStatus,
          connected: dbConnected
        },
        service: {
          name: 'wishlist-service'
        }
      });
    }
  });
} 
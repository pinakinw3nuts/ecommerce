import { FastifyRequest, FastifyReply } from 'fastify';
import { dataSource } from '@config/dataSource';
import { logger } from '@utils/logger';

export class HealthController {
  async check(_request: FastifyRequest, reply: FastifyReply) {
    try {
      // Check if database connection is initialized
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      // Perform a simple query to verify connection
      await dataSource.query('SELECT 1');

      return reply.code(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'inventory-service',
        database: {
          connected: true,
        },
        uptime: process.uptime(),
      });
    } catch (error) {
      logger.error({ error }, 'Health check failed');
      
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'inventory-service',
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown database error',
        },
      });
    }
  }
} 
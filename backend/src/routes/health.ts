import { FastifyInstance } from 'fastify';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    try {
      // Check database connection
      const isDbConnected = AppDataSource.isInitialized;
      
      // Check if we can query the database
      let dbQuerySuccess = false;
      if (isDbConnected) {
        try {
          await AppDataSource.query('SELECT 1');
          dbQuerySuccess = true;
        } catch (error) {
          logger.error('Database query failed during health check', { error });
          dbQuerySuccess = false;
        }
      }

      const healthStatus = {
        status: dbQuerySuccess ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'ecommerce-api',
        version: '1.0.0',
        database: {
          connected: isDbConnected,
          healthy: dbQuerySuccess,
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      const statusCode = dbQuerySuccess ? 200 : 503;
      
      return reply.status(statusCode).send(healthStatus);
    } catch (error) {
      logger.error('Health check failed', { error });
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to check service health',
        timestamp: new Date().toISOString(),
      });
    }
  });

  fastify.get('/ready', async (request, reply) => {
    try {
      const isDbConnected = AppDataSource.isInitialized;
      
      if (!isDbConnected) {
        return reply.status(503).send({
          status: 'not ready',
          message: 'Database not connected',
        });
      }

      return reply.send({
        status: 'ready',
        message: 'Service is ready to handle requests',
      });
    } catch (error) {
      logger.error('Readiness check failed', { error });
      return reply.status(503).send({
        status: 'not ready',
        message: 'Service is not ready',
      });
    }
  });
} 
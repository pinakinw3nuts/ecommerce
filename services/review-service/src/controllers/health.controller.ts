import { FastifyRequest, FastifyReply } from 'fastify';
import { AppDataSource } from '../config/database';
import { appLogger } from '../utils/logger';

export class HealthController {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Check the health of the service
   * Returns database connection status and service uptime
   */
  async getHealth(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Check if database is connected
      const isDbConnected = AppDataSource.isInitialized;
      
      // Calculate uptime in seconds
      const uptime = Math.floor((Date.now() - this.startTime) / 1000);
      
      // Format uptime in a human-readable format
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      
      const formattedUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      
      // Do a simple query to verify database connection is working
      let dbQuerySuccess = false;
      if (isDbConnected) {
        try {
          // Run a simple query to verify connection is actually working
          await AppDataSource.query('SELECT 1');
          dbQuerySuccess = true;
        } catch (error) {
          appLogger.error('Database query failed during health check', { error });
          dbQuerySuccess = false;
        }
      }
      
      // Construct response
      const healthStatus = {
        status: dbQuerySuccess ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: isDbConnected,
          healthy: dbQuerySuccess
        },
        service: {
          uptime: uptime,
          formattedUptime: formattedUptime
        }
      };
      
      const statusCode = dbQuerySuccess ? 200 : 503;
      
      return reply.status(statusCode).send(healthStatus);
    } catch (error) {
      appLogger.error('Health check failed', { error });
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to check service health',
        timestamp: new Date().toISOString()
      });
    }
  }
} 
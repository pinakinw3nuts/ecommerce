import { FastifyRequest, FastifyReply } from 'fastify';
import { DataSource } from 'typeorm';

export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  async check(_request: FastifyRequest, reply: FastifyReply) {
    try {
      // Check database connection
      const dbStatus = await this.checkDatabase();

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: dbStatus,
          server: {
            status: 'healthy',
            uptime: process.uptime(),
          },
        },
      };

      return reply.code(200).send(healthStatus);
    } catch (error) {
      const unhealthyStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return reply.code(503).send(unhealthyStatus);
    }
  }

  private async checkDatabase(): Promise<{ status: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('Database connection not initialized');
      }

      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
      };
    }
  }
} 
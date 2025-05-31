import { FastifyRequest, FastifyReply } from 'fastify';
import { AppDataSource } from '@config/dataSource';
import { rateService } from '@services/rate.service';
import { env } from '@config/env';
import { createLogger } from '@utils/logger';

const logger = createLogger('health-controller');

/**
 * Health controller for providing service health information
 */
export class HealthController {
  /**
   * Get basic health information
   */
  static async getHealth(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Check database connection status
      const dbStatus = AppDataSource.isInitialized ? 'connected' : 'disconnected';
      
      // Get current timestamp
      const timestamp = new Date().toISOString();
      
      // Get last rate sync time
      const lastRateSync = rateService.getLastUpdateTime()?.toISOString() || 'never';
      
      const response = {
        status: dbStatus === 'connected' ? 'ok' : 'degraded',
        timestamp,
        database: {
          status: dbStatus,
          type: AppDataSource.options.type,
        },
        rates: {
          lastSync: lastRateSync,
          default_currency: env.DEFAULT_CURRENCY
        },
        environment: env.NODE_ENV,
        version: process.env.npm_package_version || 'unknown'
      };
      
      reply.status(dbStatus === 'connected' ? 200 : 503).send(response);
    } catch (error) {
      logger.error({ error }, 'Error getting health status');
      reply.status(500).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Error getting health status'
      });
    }
  }
  
  /**
   * Get detailed health information
   */
  static async getDetailedHealth(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Check database connection status
      const dbStatus = AppDataSource.isInitialized ? 'connected' : 'disconnected';
      
      // Get current timestamp
      const timestamp = new Date().toISOString();
      
      // Get last rate sync time
      const lastRateSync = rateService.getLastUpdateTime();
      
      // Calculate uptime
      const uptime = process.uptime();
      const uptimeFormatted = formatUptime(uptime);
      
      // Get memory usage
      const memoryUsage = process.memoryUsage();
      
      const response = {
        status: dbStatus === 'connected' ? 'ok' : 'degraded',
        timestamp,
        database: {
          status: dbStatus,
          type: AppDataSource.options.type,
          initialized: AppDataSource.isInitialized,
          migrations: AppDataSource.migrations.length
        },
        rates: {
          lastSync: lastRateSync?.toISOString() || 'never',
          default_currency: env.DEFAULT_CURRENCY,
          timeSinceLastSync: lastRateSync ? 
            Math.floor((Date.now() - lastRateSync.getTime()) / 1000) : null
        },
        system: {
          uptime: uptimeFormatted,
          uptimeSeconds: uptime,
          memory: {
            rss: formatBytes(memoryUsage.rss),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            heapUsed: formatBytes(memoryUsage.heapUsed),
            external: formatBytes(memoryUsage.external)
          },
          node: process.version,
          platform: process.platform,
          arch: process.arch
        },
        environment: env.NODE_ENV,
        version: process.env.npm_package_version || 'unknown'
      };
      
      reply.status(dbStatus === 'connected' ? 200 : 503).send(response);
    } catch (error) {
      logger.error({ error }, 'Error getting detailed health status');
      reply.status(500).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Error getting detailed health status'
      });
    }
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format uptime to human readable format
 */
function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
} 
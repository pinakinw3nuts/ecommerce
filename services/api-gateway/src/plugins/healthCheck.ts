import { FastifyInstance } from 'fastify';
import { config } from '../config/env';

interface HealthCheckOptions {
  exposeMemory?: boolean;
}

interface MemoryStats {
  heapTotal: number;
  heapUsed: number;
  rss: number;
  external: number;
}

interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  memory?: MemoryStats;
}

/**
 * Configure health check endpoints
 */
export async function configureHealthCheck(
  fastify: FastifyInstance,
  options: HealthCheckOptions = {}
) {
  const exposeMemory = options.exposeMemory ?? config.server.nodeEnv === 'development';

  // Basic health check endpoint
  fastify.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Detailed health check endpoint
  fastify.get('/health/details', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' },
            environment: { type: 'string' },
            memory: {
              type: 'object',
              properties: {
                heapTotal: { type: 'number' },
                heapUsed: { type: 'number' },
                rss: { type: 'number' },
                external: { type: 'number' },
              },
            },
          },
        },
      },
    },
    handler: async (_request) => {
      const status: HealthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.server.version,
        environment: config.server.nodeEnv,
        ...(exposeMemory && {
          memory: process.memoryUsage(),
        }),
      };

      return status;
    },
  });

  // Error endpoint (for testing)
  if (config.server.nodeEnv === 'development') {
    fastify.get('/health/error', async (_request) => {
      throw new Error('Health check error test');
    });
  }
}

// Example usage:
/*
import fastify from 'fastify';
import healthCheck from './plugins/healthCheck';

const app = fastify();

await app.register(healthCheck, {
  path: '/health',
  exposeMemory: true,
});

// Now you can access:
// GET /health
*/ 
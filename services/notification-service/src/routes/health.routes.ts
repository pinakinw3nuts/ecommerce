import { FastifyInstance } from 'fastify';
import { getQueueMetrics, retryFailedJobs, cleanCompletedJobs } from '../services/queueService';
import logger from '../utils/logger';
import { combinedAuthGuard } from '../middleware/combinedAuthGuard';
import { roleGuard } from '../middleware/roleGuard';
import { queueMetricsQuerySchema, retryFailedJobsSchema, cleanCompletedJobsSchema } from '../schemas/health.schemas';
import { z } from 'zod';

/**
 * Simplified adapter function to convert Zod schemas to Fastify JSON Schema
 * Included directly in this file since it's only used here
 */
function createRouteSchema(options: {
  querystring?: z.ZodType<any>;
  body?: z.ZodType<any>;
  security?: Array<Record<string, any>>;
  description?: string;
  tags?: string[];
}) {
  const schema: Record<string, any> = {};

  if (options.description) {
    schema.description = options.description;
  }

  if (options.tags) {
    schema.tags = options.tags;
  }

  if (options.security) {
    schema.security = options.security;
  }

  if (options.querystring) {
    schema.querystring = {
      type: 'object',
      properties: {
        includeDelayed: { 
          type: 'string', 
          enum: ['true', 'false'], 
          default: 'true' 
        },
        includeFailed: { 
          type: 'string', 
          enum: ['true', 'false'], 
          default: 'true' 
        }
      }
    };
  }

  if (options.body) {
    if (options.body === retryFailedJobsSchema) {
      schema.body = {
        type: 'object',
        required: ['queue'],
        properties: {
          queue: { 
            type: 'string', 
            enum: ['email'], 
            description: 'Queue to retry failed jobs for'
          }
        }
      };
    } else if (options.body === cleanCompletedJobsSchema) {
      schema.body = {
        type: 'object',
        properties: {
          olderThan: { 
            type: 'number', 
            description: 'Age in milliseconds. Only jobs older than this will be cleaned',
            default: 24 * 60 * 60 * 1000 // 24 hours in ms
          },
          limit: { 
            type: 'number', 
            description: 'Maximum number of jobs to clean',
            default: 1000
          }
        }
      };
    }
  }

  return schema;
}

/**
 * Health check routes
 * @param fastify - The Fastify instance
 */
export async function healthRoutes(fastify: FastifyInstance) {
  // Service start time for uptime calculation
  const startTime = Date.now();

  // Root path redirects to documentation
  fastify.get('/', {
    schema: {
      description: 'Root path - redirects to API documentation',
      tags: ['Health'],
      response: {
        302: {
          description: 'Redirect to documentation',
          type: 'string'
        }
      }
    },
    handler: async (request, reply) => {
      return reply.redirect(302, '/documentation');
    }
  });

  // Simple health check endpoint
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
      
      try {
        // Get queue metrics (which requires Redis connection)
        const queueMetrics = await getQueueMetrics();
        
        reply.send({
          status: 'healthy',
          timestamp: now.toISOString(),
          uptime: uptimeMs,
          redis: {
            status: 'connected',
            connected: true
          },
          queues: {
            email: {
              active: queueMetrics.active.email || 0,
              waiting: queueMetrics.waiting.email || 0,
              delayed: queueMetrics.delayed.email || 0,
              failed: queueMetrics.failed.email || 0
            }
          },
          service: {
            name: 'notification-service'
          }
        });
      } catch (error) {
        logger.error('Health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        reply.status(503).send({
          status: 'unhealthy',
          timestamp: now.toISOString(),
          uptime: uptimeMs,
          redis: {
            status: 'disconnected',
            connected: false
          },
          queues: {
            email: {
              active: 0,
              waiting: 0,
              delayed: 0,
              failed: 0
            }
          },
          service: {
            name: 'notification-service'
          }
        });
      }
    }
  });

  // Detailed queue metrics endpoint (admin only)
  fastify.get('/health/queues', {
    schema: createRouteSchema({
      description: 'Detailed queue metrics',
      tags: ['Health'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      querystring: queueMetricsQuerySchema
    }),
    // Apply combinedAuthGuard, roleGuard, and validation middleware
    preHandler: [
      combinedAuthGuard, 
      roleGuard(['admin', 'service'])
    ],
    handler: async (request, reply) => {
      try {
        const { includeDelayed = 'true', includeFailed = 'true' } = request.query as {
          includeDelayed?: string;
          includeFailed?: string;
        };
        
        const metrics = await getQueueMetrics();
        
        // Filter metrics based on query parameters
        const filteredMetrics = {
          active: metrics.active,
          waiting: metrics.waiting,
          ...(includeDelayed === 'true' ? { delayed: metrics.delayed } : {}),
          ...(includeFailed === 'true' ? { failed: metrics.failed } : {})
        };
        
        reply.send({ metrics: filteredMetrics });
      } catch (error) {
        logger.error('Failed to get queue metrics:', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        reply.status(500).send({ 
          message: 'Failed to get queue metrics',
          error: 'QUEUE_METRICS_ERROR'
        });
      }
    }
  });
  
  // Retry failed jobs for a specific queue
  fastify.post('/health/queues/retry-failed', {
    schema: createRouteSchema({
      description: 'Retry failed jobs for a specific queue',
      tags: ['Health'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: retryFailedJobsSchema
    }),
    // Apply combinedAuthGuard, roleGuard, and validation middleware
    preHandler: [
      combinedAuthGuard, 
      roleGuard(['admin'])
    ],
    handler: async (request, reply) => {
      try {
        const { queue } = request.body as { queue: 'email' };
        
        const count = await retryFailedJobs(queue);
        
        logger.info(`Retried ${count} failed jobs in ${queue} queue`, {
          queue,
          count,
          userId: request.user.id
        });
        
        reply.send({
          message: `Successfully retried ${count} failed jobs in ${queue} queue`,
          count
        });
      } catch (error) {
        logger.error('Failed to retry failed jobs:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        reply.status(500).send({ 
          message: 'Failed to retry failed jobs',
          error: 'RETRY_FAILED_ERROR'
        });
      }
    }
  });
  
  // Clean completed jobs
  fastify.post('/health/queues/clean-completed', {
    schema: createRouteSchema({
      description: 'Clean completed jobs from queues',
      tags: ['Health'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: cleanCompletedJobsSchema
    }),
    // Apply combinedAuthGuard, roleGuard, and validation middleware
    preHandler: [
      combinedAuthGuard, 
      roleGuard(['admin'])
    ],
    handler: async (request, reply) => {
      try {
        const { olderThan = 24 * 60 * 60 * 1000, limit = 1000 } = request.body as {
          olderThan?: number;
          limit?: number;
        };
        
        const cleaned = await cleanCompletedJobs();
        
        const totalCleaned = Object.values(cleaned).reduce((sum, count) => sum + count, 0);
        
        logger.info(`Cleaned ${totalCleaned} completed jobs`, {
          cleaned,
          olderThan,
          limit,
          userId: request.user.id
        });
        
        reply.send({
          message: `Successfully cleaned ${totalCleaned} completed jobs`,
          cleaned
        });
      } catch (error) {
        logger.error('Failed to clean completed jobs:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        reply.status(500).send({ 
          message: 'Failed to clean completed jobs',
          error: 'CLEAN_COMPLETED_ERROR'
        });
      }
    }
  });
} 
import { FastifyInstance } from 'fastify';
import { getQueueMetrics, retryFailedJobs, cleanCompletedJobs } from '../services/queueService';
import logger from '../utils/logger';
import { combinedAuthGuard } from '../middleware/combinedAuthGuard';
import { roleGuard } from '../middleware/roleGuard';
import { validateRequest } from '../middleware/validateRequest';
import { queueMetricsQuerySchema, retryFailedJobsSchema, cleanCompletedJobsSchema } from '../schemas/health.schemas';
import { redisConnection } from '../utils/redis';

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
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                connected: { type: 'boolean' }
              }
            },
            queues: {
              type: 'object',
              properties: {
                email: {
                  type: 'object',
                  properties: {
                    active: { type: 'number' },
                    waiting: { type: 'number' },
                    delayed: { type: 'number' },
                    failed: { type: 'number' }
                  }
                }
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
      
      // Check Redis connection through queue metrics
      let redisStatus = 'disconnected';
      let redisConnected = false;
      let queueMetrics: {
        active: Record<string, number>;
        waiting: Record<string, number>;
        delayed: Record<string, number>;
        failed: Record<string, number>;
      } = { 
        active: { email: 0 }, 
        waiting: { email: 0 }, 
        delayed: { email: 0 }, 
        failed: { email: 0 }
      };
      
      try {
        // Get queue metrics (which requires Redis connection)
        queueMetrics = await getQueueMetrics();
        redisStatus = 'connected';
        redisConnected = true;
      } catch (error) {
        logger.error({ error }, 'Redis health check failed');
        redisStatus = 'error';
      }
      
      // Determine overall health status
      const isHealthy = redisConnected;
      
      reply.status(isHealthy ? 200 : 503).send({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: now.toISOString(),
        uptime: uptimeMs,
        redis: {
          status: redisStatus,
          connected: redisConnected
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
    }
  });

  // Detailed queue metrics endpoint (admin only)
  fastify.get('/health/queues', {
    schema: {
      description: 'Detailed queue metrics',
      tags: ['Health'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          includeDelayed: { 
            type: 'string', 
            enum: ['true', 'false'], 
            default: 'true', 
            description: 'Whether to include delayed jobs in the metrics'
          },
          includeFailed: { 
            type: 'string', 
            enum: ['true', 'false'], 
            default: 'true', 
            description: 'Whether to include failed jobs in the metrics'
          }
        }
      },
      response: {
        200: {
          description: 'Queue metrics',
          type: 'object',
          properties: {
            metrics: {
              type: 'object',
              properties: {
                active: { type: 'object', additionalProperties: { type: 'number' } },
                waiting: { type: 'object', additionalProperties: { type: 'number' } },
                delayed: { type: 'object', additionalProperties: { type: 'number' } },
                failed: { type: 'object', additionalProperties: { type: 'number' } }
              }
            }
          }
        }
      }
    },
    // Apply combinedAuthGuard, roleGuard, and validation middleware
    preHandler: [
      combinedAuthGuard, 
      roleGuard(['admin', 'service']),
      validateRequest({ querystring: queueMetricsQuerySchema })
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
          error: error instanceof Error ? error.message : 'Unknown error',
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
    schema: {
      description: 'Retry failed jobs for a specific queue',
      tags: ['Health'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: {
        type: 'object',
        required: ['queue'],
        properties: {
          queue: { 
            type: 'string', 
            enum: ['email'], 
            description: 'Queue to retry failed jobs for'
          }
        }
      },
      response: {
        200: {
          description: 'Failed jobs retry result',
          type: 'object',
          properties: {
            message: { type: 'string' },
            count: { type: 'number' }
          }
        }
      }
    },
    // Apply combinedAuthGuard, roleGuard, and validation middleware
    preHandler: [
      combinedAuthGuard, 
      roleGuard(['admin']),
      validateRequest({ body: retryFailedJobsSchema })
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
    schema: {
      description: 'Clean completed jobs from queues',
      tags: ['Health'],
      security: [{ bearerAuth: [] }, { serviceAuth: [] }],
      body: {
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
      },
      response: {
        200: {
          description: 'Clean completed jobs result',
          type: 'object',
          properties: {
            message: { type: 'string' },
            cleaned: { 
              type: 'object',
              additionalProperties: { type: 'number' }
            }
          }
        }
      }
    },
    // Apply combinedAuthGuard, roleGuard, and validation middleware
    preHandler: [
      combinedAuthGuard, 
      roleGuard(['admin']),
      validateRequest({ body: cleanCompletedJobsSchema })
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
import { FastifyInstance } from 'fastify';
import rateLimit, { RateLimitOptions, errorResponseBuilderContext } from '@fastify/rate-limit';
import Redis from 'ioredis';
import { config } from '../config/env';
import { httpLogger as logger } from '../utils/logger';

/**
 * Configure rate limiting for the application
 */
export async function configureRateLimiter(fastify: FastifyInstance) {
  logger.info('Configuring rate limiter');

  // Create Redis client if Redis is enabled
  let redisClient: Redis | undefined;
  let useRedis = false;
  
  if (config.redis.enabled && config.redis.url) {
    try {
      // Create Redis client with better error handling options
      redisClient = new Redis(config.redis.url, {
        connectTimeout: 2000, // 2 seconds timeout for connection
        maxRetriesPerRequest: 0, // Don't retry requests
        retryStrategy: () => null, // Disable auto-reconnect
        enableOfflineQueue: false, // Don't queue commands when disconnected
      });
      
      // Add error handler before any operations
      redisClient.on('error', (err) => {
        logger.error({ err }, 'Redis error occurred, rate limiter will fallback to memory store');
        useRedis = false;
      });
      
      // Test connection with a timeout
      const pingPromise = Promise.race([
        new Promise<boolean>(async (resolve) => {
          try {
            if (redisClient) {
              await redisClient.ping();
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (err) {
            logger.error({ err }, 'Redis ping failed');
            resolve(false);
          }
        }),
        new Promise<boolean>((resolve) => 
          setTimeout(() => {
            logger.warn('Redis ping timeout');
            resolve(false);
          }, 2000)
        )
      ]);
      
      useRedis = await pingPromise;
      
      if (useRedis) {
        logger.info('Redis client created and connected successfully');
      } else {
        logger.warn('Redis ping failed or timed out, falling back to in-memory store');
        if (redisClient) {
          try {
            redisClient.disconnect();
          } catch (e) {
            // Ignore errors on disconnect
          }
          redisClient = undefined;
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to connect to Redis, falling back to in-memory store');
      // Clean up the failed connection
      if (redisClient) {
        try {
          redisClient.disconnect();
        } catch (e) {
          // Ignore errors on disconnect
        }
        redisClient = undefined;
      }
    }
  } else {
    logger.info('Redis is not configured, using in-memory store for rate limiting');
  }

  // Register rate limit plugin - always provide a configuration that works
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder: function (_request, context: errorResponseBuilderContext) {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        data: {
          timeWindow: `${config.rateLimit.windowMs}ms`,
          limit: context.max,
          remaining: 0,
          reset: context.ttl,
          retryAfter: context.ttl,
        },
      };
    },
    enableDraftSpec: true,
    // Only use Redis if we successfully connected
    redis: useRedis && redisClient ? redisClient : undefined,
    onExceeded: (req) => {
      logger.warn({
        msg: 'Rate limit exceeded',
        ip: req.ip,
        path: req.url,
        headers: req.headers,
      });
    },
  } as RateLimitOptions);

  // Log rate limiter configuration
  logger.info({
    msg: 'Rate limiter configured',
    config: {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.windowMs,
      usingRedis: useRedis,
      storageType: useRedis ? 'redis' : 'memory',
    },
  });
}

// Example usage:
/*
import fastify from 'fastify';
import { configureRateLimiter } from './middlewares/rateLimiter';

const app = fastify();

await configureRateLimiter(app);
*/ 
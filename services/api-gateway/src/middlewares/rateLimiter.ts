import { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { config } from '../config/env';
import { httpLogger as logger } from '../utils/logger';

/**
 * Configure rate limiting middleware
 */
export async function configureRateLimiter(fastify: FastifyInstance): Promise<void> {
  try {
    const useInMemoryCache = process.env['USE_IN_MEMORY_CACHE'] === 'true';
    const redisEnabled = config.redis.enabled && !useInMemoryCache;

    let options: any = {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.windowMs,
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
      // Skip rate limiting for health check
      skipOnError: true,
      keyGenerator: (request: FastifyRequest) => {
        // Use IP address or user ID (if authenticated) as the key
        const authHeader = request.headers.authorization;
        const userId = authHeader ? 'user-' + authHeader.split(' ')[1] : null;
        return userId || request.ip;
      },
    };

    // Configure Redis if available
    if (redisEnabled) {
      logger.info('Configuring rate limiter with Redis');
      const { Redis } = await import('ioredis');
      const redis = new Redis(config.redis.url as string);
      
      redis.on('error', (err) => {
        logger.error({ err }, 'Redis connection error');
      });
      
      options.redis = redis;
    } else {
      // Use default in-memory store
      logger.info('Configuring rate limiter with in-memory store');
      // Don't specify any store option to use the default in-memory implementation
    }

    // Register rate limiter
    await fastify.register(fastifyRateLimit, options);
    
    logger.info('Rate limiting configured successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to configure rate limiting');
    throw error;
  }
}

// Example usage:
/*
import fastify from 'fastify';
import { configureRateLimiter } from './middlewares/rateLimiter';

const app = fastify();

await configureRateLimiter(app);
*/ 
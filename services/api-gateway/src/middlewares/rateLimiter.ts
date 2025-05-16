import { FastifyInstance } from 'fastify';
import rateLimit, { RateLimitOptions, errorResponseBuilderContext } from '@fastify/rate-limit';
import { config } from '../config/env';
import { httpLogger as logger } from '../utils/logger';

/**
 * Configure rate limiting for the application
 */
export async function configureRateLimiter(fastify: FastifyInstance) {
  logger.info('Configuring rate limiter');

  // Register rate limit plugin
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
    redis: config.redis.enabled ? {
      url: config.redis.url as string,
      prefix: 'rate-limit:',
    } : undefined,
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
      usingRedis: config.redis.enabled,
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
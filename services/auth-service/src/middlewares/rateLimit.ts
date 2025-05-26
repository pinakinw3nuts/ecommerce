import { FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';
import logger from '../utils/logger';

const rateLimitLogger = logger.child({ module: 'rate-limit' });

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export const createRateLimiter = (redis: Redis, options: RateLimitOptions) => {
  const { windowMs, max, keyPrefix = 'ratelimit:' } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const key = `${keyPrefix}${request.ip}`;
      
      const result = await redis
        .multi()
        .incr(key)
        .expire(key, Math.floor(windowMs / 1000))
        .exec();

      if (!result) {
        throw new Error('Redis operation failed');
      }

      const current = Number(result[0][1]);
      const remaining = Math.max(0, max - current);
      const reset = Date.now() + windowMs;

      // Set rate limit headers
      reply.header('X-RateLimit-Limit', max);
      reply.header('X-RateLimit-Remaining', remaining);
      reply.header('X-RateLimit-Reset', reset);

      if (current > max) {
        rateLimitLogger.warn({
          ip: request.ip,
          path: request.url,
          current,
          max
        }, 'Rate limit exceeded');

        return reply.status(429).send({
          status: 'error',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
    } catch (error) {
      rateLimitLogger.error({ error }, 'Rate limit error');
      // Continue on error to not block requests
    }
  };
};

// Specific rate limiters
export const adminLoginRateLimit = (redis: Redis) => 
  createRateLimiter(redis, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    keyPrefix: 'ratelimit:admin:login:'
  });

export const loginRateLimit = (redis: Redis) =>
  createRateLimiter(redis, {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 attempts per window
    keyPrefix: 'ratelimit:login:'
  });

export const defaultRateLimit = (redis: Redis) =>
  createRateLimiter(redis, {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    keyPrefix: 'ratelimit:default:'
  }); 
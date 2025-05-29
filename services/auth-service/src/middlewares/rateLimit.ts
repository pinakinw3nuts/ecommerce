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
  const windowSeconds = Math.floor(windowMs / 1000);

  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip rate limiting in development to improve developer experience
    // or if Redis is not available
    if (process.env.NODE_ENV === 'development' || !redis) {
      return;
    }
    
    try {
      const key = `${keyPrefix}${request.ip}`;
      
      // Use pipelining for better performance
      const result = await redis.pipeline()
        .incr(key)
        .expire(key, windowSeconds)
        .get(key)
        .exec();

      if (!result) {
        throw new Error('Redis operation failed');
      }

      const current = Number(result[2][1]); // Get value from the GET operation
      const remaining = Math.max(0, max - current);
      const reset = Date.now() + windowMs;

      // Set rate limit headers
      reply.header('X-RateLimit-Limit', max);
      reply.header('X-RateLimit-Remaining', remaining);
      reply.header('X-RateLimit-Reset', reset);

      if (current > max) {
        // Only log in production to reduce overhead
        if (process.env.NODE_ENV === 'production') {
          rateLimitLogger.warn({
            ip: request.ip,
            path: request.url,
            current,
            max
          }, 'Rate limit exceeded');
        }

        return reply.status(429).send({
          status: 'error',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: windowSeconds
        });
      }
    } catch (error) {
      // Only log errors in production
      if (process.env.NODE_ENV === 'production') {
        rateLimitLogger.error({ error }, 'Rate limit error');
      }
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
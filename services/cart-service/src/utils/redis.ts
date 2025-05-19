import Redis from 'ioredis';
import { config } from '../config/env';
import { createLogger } from './logger';

const logger = createLogger('redis');
const redisLogger = logger.child({ context: 'redis' });

// Create Redis client with configuration if URL is provided
const redis = config.redisUrl ? new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    redisLogger.warn({ err }, 'Redis connection error - attempting reconnect');
    // Only retry on specific errors
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
}) : null;

// Handle Redis events if client exists
if (redis) {
  redis.on('connect', () => {
    redisLogger.info('Connected to Redis');
  });

  redis.on('ready', () => {
    redisLogger.info('Redis client ready');
  });

  redis.on('error', (err: Error) => {
    redisLogger.error({ err }, 'Redis client error');
  });

  redis.on('close', () => {
    redisLogger.warn('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    redisLogger.info('Reconnecting to Redis');
  });
} else {
  redisLogger.warn('Redis URL not provided, running without cache');
}

// Utility function to handle Redis operations with error handling
export const executeRedisCommand = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null> => {
  if (!redis) {
    redisLogger.debug('Redis not configured, skipping operation');
    return null;
  }

  try {
    return await operation();
  } catch (error) {
    redisLogger.error({ error }, errorMessage);
    return null;
  }
};

// Cache utility functions
export const cacheGet = async (key: string): Promise<string | null> => {
  return executeRedisCommand(
    () => redis!.get(key),
    `Error getting cache key: ${key}`
  );
};

export const cacheSet = async (
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> => {
  const result = await executeRedisCommand(async () => {
    if (ttlSeconds) {
      await redis!.setex(key, ttlSeconds, value);
    } else {
      await redis!.set(key, value);
    }
    return true;
  }, `Error setting cache key: ${key}`);
  
  return result ?? false;
};

export const cacheDelete = async (key: string): Promise<boolean> => {
  const result = await executeRedisCommand(async () => {
    const deleted = await redis!.del(key);
    return deleted > 0;
  }, `Error deleting cache key: ${key}`);
  
  return result ?? false;
};

// Cart-specific cache keys
export const getCacheKey = {
  cart: (userId: string) => `cart:${userId}`,
  cartItem: (userId: string, productId: string) => `cart:${userId}:item:${productId}`,
};

// Export Redis client instance (may be null if not configured)
export default redis; 
import Redis from 'ioredis';
import logger from './logger';
import { config } from '../config';

// Get Redis URL from config
const REDIS_URL = config.redisUrl;

// Mock Redis implementation for development mode when no Redis server is available
class MockRedis {
  private data: Map<string, any> = new Map();
  private subscriptions: Map<string, Function[]> = new Map();

  async connect() {
    logger.warn('Using mock Redis implementation - not suitable for production');
    return 'OK';
  }

  async ping() {
    return 'PONG';
  }

  async get(key: string) {
    return this.data.get(key);
  }

  async set(key: string, value: any) {
    this.data.set(key, value);
    return 'OK';
  }

  async del(key: string) {
    this.data.delete(key);
    return 1;
  }

  async quit() {
    return 'OK';
  }

  async waitUntilReady() {
    return true;
  }

  // Add any other methods needed for basic functionality
  // This is not a complete implementation, just enough to prevent crashes
}

// Create a Redis connection or mock in development mode
let redisConnection: Redis | MockRedis;

try {
  if (config.isDevelopment && process.env.USE_MOCK_REDIS === 'true') {
    // Use mock Redis in development when specified
    redisConnection = new MockRedis() as any;
    logger.warn('Using mock Redis implementation - not connecting to a real Redis server');
  } else {
    // Use real Redis connection
    redisConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });
  }
} catch (error) {
  logger.error(`Failed to create Redis connection: ${error}`);
  if (config.isDevelopment) {
    logger.warn('Falling back to mock Redis implementation in development mode');
    redisConnection = new MockRedis() as any;
  } else {
    throw error;
  }
}

// Export the Redis connection
export { redisConnection };

// Initialize Redis connection
export async function initializeRedis(): Promise<void> {
  try {
    if (redisConnection instanceof Redis) {
      await redisConnection.connect();
      logger.info('Redis connection established successfully');
      
      // Ping Redis to ensure connection is working
      const pong = await redisConnection.ping();
      logger.info(`Redis ping response: ${pong}`);
    } else {
      // Mock Redis implementation
      await redisConnection.connect();
      logger.info('Mock Redis initialized in development mode');
    }
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error}`);
    if (config.isDevelopment) {
      logger.warn('Continuing without Redis in development mode - functionality will be limited');
    } else {
      throw error;
    }
  }
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
  try {
    await redisConnection.quit();
    logger.info('Redis connection closed successfully');
  } catch (error) {
    logger.error(`Error closing Redis connection: ${error}`);
    // Don't throw in development mode
    if (!config.isDevelopment) {
      throw error;
    }
  }
}

export default {
  redisConnection,
  initializeRedis,
  closeRedis
}; 
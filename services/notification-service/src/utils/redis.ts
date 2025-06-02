import Redis from 'ioredis';
import logger from './logger';
import { config } from '../config';

// Get Redis URL from config
const REDIS_URL = config.redisUrl;

/**
 * Mock Redis implementation for development mode when no Redis server is available
 */
export class MockRedis {
  private data: Map<string, any> = new Map();
  private connected: boolean = false;

  async connect(): Promise<string> {
    if (this.connected) {
      return 'ALREADY_CONNECTED';
    }
    
    this.connected = true;
    logger.warn('Using mock Redis implementation - not suitable for production');
    return 'OK';
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async get(key: string): Promise<any> {
    return this.data.get(key);
  }

  async set(key: string, value: any): Promise<string> {
    this.data.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    this.data.delete(key);
    return 1;
  }

  async quit(): Promise<string> {
    this.connected = false;
    return 'OK';
  }

  async waitUntilReady(): Promise<boolean> {
    if (!this.connected) {
      await this.connect();
    }
    return true;
  }
}

/**
 * Create a Redis connection based on configuration
 */
function createRedisConnection(): Redis | MockRedis {
  const useMockRedis = config.useMockRedis;

  try {
    if (useMockRedis) {
      logger.warn('Using mock Redis implementation - not connecting to a real Redis server');
      return new MockRedis();
    } else {
      return new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
      });
    }
  } catch (error) {
    logger.error(`Failed to create Redis connection: ${error}`);
    if (config.isDevelopment) {
      logger.warn('Falling back to mock Redis implementation in development mode');
      return new MockRedis();
    } else {
      throw error;
    }
  }
}

// Create a Redis connection or mock in development mode
let redisConnection: Redis | MockRedis = createRedisConnection();

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<void> {
  try {
    if (redisConnection instanceof MockRedis) {
      await redisConnection.connect();
      logger.info('Mock Redis initialized in development mode');
    } else if (redisConnection instanceof Redis) {
      await redisConnection.connect();
      logger.info('Redis connection established successfully');
      
      // Ping Redis to ensure connection is working
      const pong = await redisConnection.ping();
      logger.info(`Redis ping response: ${pong}`);
    }
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error}`);
    if (config.isDevelopment) {
      logger.warn('Falling back to mock Redis implementation after connection failure');
      redisConnection = new MockRedis();
      await redisConnection.connect();
      logger.info('Mock Redis initialized in development mode after connection failure');
    } else {
      throw error;
    }
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  try {
    await redisConnection.quit();
    logger.info('Redis connection closed successfully');
  } catch (error) {
    logger.error(`Error closing Redis connection: ${error}`);
    if (!config.isDevelopment) {
      throw error;
    }
  }
}

// Export Redis connection
export { redisConnection };

export default {
  redisConnection,
  initializeRedis,
  closeRedis
}; 
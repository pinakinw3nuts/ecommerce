import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables from .env.test if it exists, otherwise from .env
dotenv.config({ path: '.env.test' });

// Mock the logger to avoid console output during tests
vi.mock('@utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn()
  },
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn()
  }
}));

// Mock TypeORM's DataSource
vi.mock('@config/dataSource', () => ({
  AppDataSource: {
    initialize: vi.fn().mockResolvedValue(true),
    isInitialized: true,
    getRepository: vi.fn().mockImplementation((entity) => {
      return {
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'mock-id', ...data })),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
        delete: vi.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          leftJoinAndSelect: vi.fn().mockReturnThis(),
          getMany: vi.fn().mockResolvedValue([]),
          getOne: vi.fn().mockResolvedValue(null)
        })
      };
    })
  },
  initializeDataSource: vi.fn().mockResolvedValue(true)
}));

// Mock environment variables
vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3012,
    API_PREFIX: '/api/v1',
    LOG_LEVEL: 'error',
    CORS_ORIGIN: '*',
    DB_HOST: 'localhost',
    DB_PORT: 5432,
    DB_USERNAME: 'test',
    DB_PASSWORD: 'test',
    DB_DATABASE: 'test_db',
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '1h'
  },
  default: {
    NODE_ENV: 'test',
    PORT: 3012,
    API_PREFIX: '/api/v1',
    LOG_LEVEL: 'error',
    CORS_ORIGIN: '*',
    DB_HOST: 'localhost',
    DB_PORT: 5432,
    DB_USERNAME: 'test',
    DB_PASSWORD: 'test',
    DB_DATABASE: 'test_db',
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '1h'
  }
})); 
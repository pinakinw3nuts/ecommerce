import { config } from '@/config';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { AppDataSource } from '@/config/database';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'cms_test';

// Mock logger to avoid console output during tests
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
    }),
  },
  createContextLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  }),
}));

// Setup database connection before tests
beforeAll(async () => {
  // Initialize the database connection
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  // Clear all tables before tests
  await clearDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

// Clear database after each test
afterEach(async () => {
  await clearDatabase();
});

/**
 * Clear all tables in the database
 */
async function clearDatabase() {
  const entities = AppDataSource.entityMetadatas;
  
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    await repository.clear();
  }
} 
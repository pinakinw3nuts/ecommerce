import { vi } from 'vitest';
import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(process.cwd(), '.env.test') });

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters';
process.env.DB_PASSWORD = 'test-db-password';

// Mock database connection
vi.mock('typeorm', () => {
  const actual = vi.importActual('typeorm');
  return {
    ...actual,
    createConnection: vi.fn().mockResolvedValue({
      isConnected: true,
      close: vi.fn().mockResolvedValue(undefined)
    }),
    getConnection: vi.fn().mockReturnValue({
      isConnected: true,
      close: vi.fn().mockResolvedValue(undefined),
      manager: {
        transaction: vi.fn().mockImplementation(cb => cb({}))
      }
    })
  };
});

// Mock logger to prevent console noise during tests
vi.mock('../utils/logger', () => {
  return {
    default: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
      child: () => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn()
      })
    },
    createChildLogger: vi.fn().mockReturnValue({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn()
    }),
    createRequestLogger: vi.fn().mockReturnValue({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn()
    })
  };
});

// Global before all hook
beforeAll(() => {
  console.log('Starting company-service tests...');
});

// Global after all hook
afterAll(() => {
  console.log('Finished company-service tests.');
});

// Global after each hook
afterEach(() => {
  vi.clearAllMocks();
}); 
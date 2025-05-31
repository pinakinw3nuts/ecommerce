import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import { AppDataSource } from '@config/database';

// Mock the database connection
vi.mock('@config/database', () => {
  const mockRepository = {
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createQueryBuilder: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn(),
      getOne: vi.fn(),
      execute: vi.fn()
    }))
  };

  return {
    AppDataSource: {
      initialize: vi.fn().mockResolvedValue(true),
      isInitialized: true,
      getRepository: vi.fn().mockReturnValue(mockRepository)
    },
    getRepository: vi.fn().mockReturnValue(mockRepository),
    initializeDatabase: vi.fn().mockResolvedValue(true)
  };
});

// Mock environment variables
vi.mock('@config', () => ({
  config: {
    port: 3014,
    host: 'localhost',
    isDevelopment: true,
    isProduction: false,
    jwtSecret: 'test-jwt-secret',
    logLevel: 'silent',
    databaseUrl: 'postgres://test:test@localhost:5432/test_db',
    corsOrigins: ['http://localhost:3000'],
    nodeEnv: 'test',
    version: '1.0.0'
  }
}));

// Mock logger
vi.mock('@utils/logger', () => ({
  appLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn()
  },
  dbLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn()
  },
  authLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn()
  }
}));

// Mock JWT token for authentication
export const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlcyI6WyJ1c2VyIl0sImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
export const mockAdminJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk4NzY1NDMyMTAiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNTE2MjM5MDIyfQ.t-pMXCyRfWavuRjjxxXgYMvbvNYoG5-vYpn5g0qbvJM';

// Setup MSW server for mocking external API calls
export const server = setupServer(
  http.get('*/product-service/api/products/:id', ({ params }) => {
    const { id } = params;
    return Response.json({
      id,
      name: `Test Product ${id}`,
      price: 99.99,
      description: 'A test product',
      category: 'Test Category'
    });
  })
);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
}); 
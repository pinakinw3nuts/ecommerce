import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { buildApp } from '@/app';
import { FastifyInstance } from 'fastify';
import { dataSource } from '@config/dataSource';

// Mock the dataSource
vi.mock('@config/dataSource', () => ({
  dataSource: {
    isInitialized: true,
    initialize: vi.fn(),
    query: vi.fn().mockResolvedValue([{ '1': 1 }])
  }
}));

// Mock logger
vi.mock('@utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

describe('Health Routes', () => {
  let app: FastifyInstance;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
    await app.ready();
  });
  
  afterEach(async () => {
    await app.close();
  });

  it('should return 200 and service status when database is connected', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    
    const payload = JSON.parse(response.payload);
    expect(payload.status).toBe('ok');
    expect(payload.service).toBe('inventory-service');
    expect(payload.database.connected).toBe(true);
    expect(payload.timestamp).toBeTruthy();
    expect(new Date(payload.timestamp).getTime()).not.toBeNaN();
    expect(payload.uptime).toBeGreaterThan(0);
    
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('should return 503 when database connection fails', async () => {
    // Mock database query to fail
    vi.mocked(dataSource.query).mockRejectedValueOnce(new Error('Database connection error'));

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(503);
    
    const payload = JSON.parse(response.payload);
    expect(payload.status).toBe('error');
    expect(payload.service).toBe('inventory-service');
    expect(payload.database.connected).toBe(false);
    expect(payload.timestamp).toBeTruthy();
    expect(payload.error).toBe('Database connection error');
  });

  it('should initialize database connection if not initialized', async () => {
    // Mock database as not initialized
    vi.mocked(dataSource.isInitialized).mockReturnValueOnce(false);

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(dataSource.initialize).toHaveBeenCalled();
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });
}); 
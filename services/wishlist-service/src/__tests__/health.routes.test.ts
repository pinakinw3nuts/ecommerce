import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { healthRoutes } from '../routes/health.routes';

// Mock the database
vi.mock('../config/database', () => ({
  AppDataSource: {
    isInitialized: true,
    query: vi.fn().mockResolvedValue([{ '1': 1 }])
  }
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Create a new Fastify instance for each test
    app = Fastify();
    
    // Register the routes
    app.register(healthRoutes);
    
    // Wait for the app to be ready
    await app.ready();
    
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Close the app after each test
    app.close();
  });

  describe('GET /health', () => {
    it('should return 200 status when database is connected', async () => {
      // Make the request
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      // Parse the response
      const payload = JSON.parse(response.payload);
      
      // Verify the response status
      expect(response.statusCode).toBe(200);
      
      // Verify the response structure
      expect(payload).toHaveProperty('status', 'healthy');
      expect(payload).toHaveProperty('timestamp');
      expect(payload).toHaveProperty('uptime');
      expect(payload).toHaveProperty('database');
      expect(payload.database).toHaveProperty('status', 'connected');
      expect(payload.database).toHaveProperty('connected', true);
      expect(payload).toHaveProperty('service');
      expect(payload.service).toHaveProperty('name', 'wishlist-service');
    });

    it('should return 503 status when database is disconnected', async () => {
      // Mock database connection failure
      const AppDataSource = await import('../config/database').then(m => m.AppDataSource);
      vi.spyOn(AppDataSource, 'query').mockRejectedValueOnce(new Error('Connection error'));
      
      // Make the request
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      // Parse the response
      const payload = JSON.parse(response.payload);
      
      // Verify the response status
      expect(response.statusCode).toBe(503);
      
      // Verify the response structure
      expect(payload).toHaveProperty('status', 'unhealthy');
      expect(payload).toHaveProperty('timestamp');
      expect(payload).toHaveProperty('uptime');
      expect(payload).toHaveProperty('database');
      expect(payload.database).toHaveProperty('status', 'error');
      expect(payload.database).toHaveProperty('connected', false);
    });

    it('should return timestamp in ISO format', async () => {
      // Make the request
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      // Parse the response
      const payload = JSON.parse(response.payload);
      
      // Verify the timestamp is in ISO format
      const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(timestampRegex.test(payload.timestamp)).toBe(true);
    });

    it('should return a numeric uptime value', async () => {
      // Make the request
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      // Parse the response
      const payload = JSON.parse(response.payload);
      
      // Verify the uptime is a number
      expect(typeof payload.uptime).toBe('number');
      expect(payload.uptime).toBeGreaterThanOrEqual(0);
    });
  });
}); 
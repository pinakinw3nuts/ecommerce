import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HealthController } from '@controllers/health.controller';
import { FastifyRequest, FastifyReply } from 'fastify';

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
  },
}));

describe('HealthController', () => {
  let healthController: HealthController;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    healthController = new HealthController();
    
    // Setup mock request and reply
    mockRequest = {};
    
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('check', () => {
    it('should return 200 status when database is connected', async () => {
      // Act
      await healthController.check(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String),
          service: 'inventory-service',
          database: {
            connected: true,
          },
          uptime: expect.any(Number),
        })
      );
    });
    
    it('should return 503 status when database connection fails', async () => {
      // Arrange
      const mockDataSource = require('@config/dataSource').dataSource;
      mockDataSource.query = vi.fn().mockRejectedValue(new Error('Database connection error'));
      
      // Act
      await healthController.check(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(503);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          timestamp: expect.any(String),
          service: 'inventory-service',
          database: {
            connected: false,
            error: 'Database connection error',
          },
        })
      );
    });
    
    it('should initialize database if not already initialized', async () => {
      // Arrange
      const mockDataSource = require('@config/dataSource').dataSource;
      mockDataSource.isInitialized = false;
      
      // Act
      await healthController.check(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      // Assert
      expect(mockDataSource.initialize).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
    });
  });
}); 
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AlertController } from '@controllers/alert.controller';
import { FastifyRequest, FastifyReply } from 'fastify';

// Mock the AlertService
vi.mock('@services/alert.service', () => {
  return {
    AlertService: vi.fn().mockImplementation(() => ({
      getLowStockItems: vi.fn().mockResolvedValue([
        {
          id: '1',
          sku: 'P111',
          productId: 'prod-1',
          stock: 3,
          threshold: 5,
          isLowStock: true,
          location: 'warehouse-1',
        },
        {
          id: '2',
          sku: 'P222',
          productId: 'prod-2',
          stock: 2,
          threshold: 5,
          isLowStock: true,
          location: 'warehouse-2',
        },
      ]),
      getCriticalLowStockItems: vi.fn().mockResolvedValue([
        {
          id: '3',
          sku: 'P333',
          productId: 'prod-3',
          stock: 1,
          threshold: 5,
          isLowStock: true,
          location: 'warehouse-1',
        },
      ]),
      checkThresholdBreaches: vi.fn().mockResolvedValue({
        lowStock: [
          {
            id: '1',
            sku: 'P111',
            productId: 'prod-1',
            stock: 3,
            threshold: 5,
            isLowStock: true,
            location: 'warehouse-1',
          },
          {
            id: '2',
            sku: 'P222',
            productId: 'prod-2',
            stock: 2,
            threshold: 5,
            isLowStock: true,
            location: 'warehouse-2',
          },
        ],
        criticalLowStock: [
          {
            id: '3',
            sku: 'P333',
            productId: 'prod-3',
            stock: 1,
            threshold: 5,
            isLowStock: true,
            location: 'warehouse-1',
          },
        ],
        outOfStock: [
          {
            id: '4',
            sku: 'P444',
            productId: 'prod-4',
            stock: 0,
            threshold: 5,
            isLowStock: true,
            location: 'warehouse-2',
          },
        ],
      }),
    })),
  };
});

// Mock logger
vi.mock('@utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('AlertController', () => {
  let alertController: AlertController;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    alertController = new AlertController();
    
    // Setup mock request and reply
    mockRequest = {
      query: {},
      headers: {},
      user: { id: 'user-1', role: 'admin' },
    };
    
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('getLowStockAlerts', () => {
    it('should return low stock alerts when user has admin role', async () => {
      // Arrange
      mockRequest.user = { id: 'user-1', role: 'admin' };
      
      // Act
      await alertController.getLowStockAlerts(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            lowStock: expect.arrayContaining([
              expect.objectContaining({ id: '1' }),
              expect.objectContaining({ id: '2' }),
            ]),
            criticalLowStock: expect.arrayContaining([
              expect.objectContaining({ id: '3' }),
            ]),
            outOfStock: expect.arrayContaining([
              expect.objectContaining({ id: '4' }),
            ]),
          }),
        })
      );
    });
    
    it('should return 403 when user does not have admin role', async () => {
      // Arrange
      mockRequest.user = { id: 'user-1', role: 'user' };
      
      // Act
      await alertController.getLowStockAlerts(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Forbidden: Insufficient permissions',
        })
      );
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      mockRequest.user = { id: 'user-1', role: 'admin' };
      
      const mockAlertService = (alertController as any).alertService;
      mockAlertService.checkThresholdBreaches = vi.fn().mockRejectedValue(
        new Error('Database error')
      );
      
      // Act
      await alertController.getLowStockAlerts(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to get low stock alerts: Database error',
        })
      );
    });
    
    it('should filter by location if query parameter is provided', async () => {
      // Arrange
      mockRequest.user = { id: 'user-1', role: 'admin' };
      mockRequest.query = { location: 'warehouse-1' };
      
      const mockAlertService = (alertController as any).alertService;
      mockAlertService.checkThresholdBreaches = vi.fn().mockResolvedValue({
        lowStock: [
          {
            id: '1',
            sku: 'P111',
            productId: 'prod-1',
            stock: 3,
            threshold: 5,
            isLowStock: true,
            location: 'warehouse-1',
          },
        ],
        criticalLowStock: [
          {
            id: '3',
            sku: 'P333',
            productId: 'prod-3',
            stock: 1,
            threshold: 5,
            isLowStock: true,
            location: 'warehouse-1',
          },
        ],
        outOfStock: [],
      });
      
      // Act
      await alertController.getLowStockAlerts(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            lowStock: expect.arrayContaining([
              expect.objectContaining({ id: '1', location: 'warehouse-1' }),
            ]),
            criticalLowStock: expect.arrayContaining([
              expect.objectContaining({ id: '3', location: 'warehouse-1' }),
            ]),
            outOfStock: [],
          }),
        })
      );
    });
  });
}); 
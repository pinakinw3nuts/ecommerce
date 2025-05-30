import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AlertService } from '@services/alert.service';
import { Repository } from 'typeorm';

// Mock the dataSource and repositories
vi.mock('@config/dataSource', () => {
  const mockInventoryRepo = {
    find: vi.fn(),
    createQueryBuilder: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getMany: vi.fn(),
    })),
  };
  
  return {
    dataSource: {
      getRepository: vi.fn(() => mockInventoryRepo),
    },
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

// Mock env config
vi.mock('@config/env', () => ({
  env: {
    ALERT_STOCK_THRESHOLD: 5,
  },
}));

describe('AlertService - Low Stock Alerts', () => {
  let alertService: AlertService;
  let mockInventoryRepo: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    alertService = new AlertService();
    
    // Get reference to the mocked repository
    mockInventoryRepo = (alertService as any).inventoryRepository;
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('checkThresholdBreaches', () => {
    it('should categorize inventory items correctly based on stock levels', async () => {
      // Arrange
      const mockItems = [
        // Low stock (stock <= threshold but > 0)
        { id: '1', sku: 'P111', stock: 5, threshold: 5, isActive: true },
        { id: '2', sku: 'P222', stock: 4, threshold: 5, isActive: true },
        
        // Critical low stock (stock <= threshold * 0.5)
        { id: '3', sku: 'P333', stock: 2, threshold: 5, isActive: true },
        
        // Out of stock (stock = 0)
        { id: '4', sku: 'P444', stock: 0, threshold: 5, isActive: true },
        
        // Normal stock level (stock > threshold)
        { id: '5', sku: 'P555', stock: 10, threshold: 5, isActive: true },
        
        // Inactive item (should be ignored)
        { id: '6', sku: 'P666', stock: 1, threshold: 5, isActive: false },
      ];
      
      mockInventoryRepo.find = vi.fn().mockResolvedValue(mockItems);
      
      // Act
      const result = await alertService.checkThresholdBreaches();
      
      // Assert
      expect(result.lowStock).toHaveLength(2);
      expect(result.lowStock.map(item => item.id)).toEqual(['1', '2']);
      
      expect(result.criticalLowStock).toHaveLength(1);
      expect(result.criticalLowStock[0].id).toBe('3');
      
      expect(result.outOfStock).toHaveLength(1);
      expect(result.outOfStock[0].id).toBe('4');
      
      // Verify the find call was made correctly
      expect(mockInventoryRepo.find).toHaveBeenCalledWith({
        where: { isActive: true }
      });
    });
    
    it('should handle empty inventory', async () => {
      // Arrange
      mockInventoryRepo.find = vi.fn().mockResolvedValue([]);
      
      // Act
      const result = await alertService.checkThresholdBreaches();
      
      // Assert
      expect(result.lowStock).toHaveLength(0);
      expect(result.criticalLowStock).toHaveLength(0);
      expect(result.outOfStock).toHaveLength(0);
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockInventoryRepo.find = vi.fn().mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(alertService.checkThresholdBreaches()).rejects.toThrow('Database error');
    });
  });
  
  describe('getLowStockItems', () => {
    it('should return items with stock <= threshold and > 0', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          { id: '1', sku: 'P111', stock: 5, threshold: 5 },
          { id: '2', sku: 'P222', stock: 3, threshold: 5 },
        ]),
      };
      
      mockInventoryRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      
      // Act
      const result = await alertService.getLowStockItems();
      
      // Assert
      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'inventory.isActive = :isActive', 
        { isActive: true }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.stock <= inventory.threshold'
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.stock > 0'
      );
    });
  });
  
  describe('getCriticalLowStockItems', () => {
    it('should return items with stock <= threshold * 0.5', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          { id: '1', sku: 'P111', stock: 2, threshold: 5 },
          { id: '2', sku: 'P222', stock: 1, threshold: 5 },
        ]),
      };
      
      mockInventoryRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      
      // Act
      const result = await alertService.getCriticalLowStockItems();
      
      // Assert
      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'inventory.isActive = :isActive', 
        { isActive: true }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.stock <= inventory.threshold * 0.5'
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.stock > 0'
      );
    });
  });
  
  describe('sendLowStockNotifications', () => {
    it('should log notifications for low stock items', async () => {
      // Arrange
      const mockItems = [
        { 
          id: '1', 
          sku: 'P111', 
          stock: 3, 
          threshold: 5,
          location: 'warehouse-1',
          productId: 'prod-1'
        },
        { 
          id: '2', 
          sku: 'P222', 
          stock: 2, 
          threshold: 5,
          location: 'warehouse-2',
          productId: 'prod-2'
        },
        { 
          id: '3', 
          sku: 'P333', 
          stock: 1, 
          threshold: 5,
          location: 'warehouse-1',
          productId: 'prod-3'
        },
      ];
      
      const mockLogger = vi.mocked(require('@utils/logger').logger);
      
      // Act
      const result = await alertService.sendLowStockNotifications(mockItems);
      
      // Assert
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          itemCount: 3,
        }),
        'Sending low stock notifications'
      );
      
      // Check that we're grouping by location
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          locationCount: 2,
          itemsByLocation: expect.arrayContaining([
            expect.objectContaining({
              location: 'warehouse-1',
              count: 2
            }),
            expect.objectContaining({
              location: 'warehouse-2',
              count: 1
            })
          ])
        }),
        'Low stock notification would be sent'
      );
    });
    
    it('should handle empty items array', async () => {
      // Arrange
      const mockItems: any[] = [];
      const mockLogger = vi.mocked(require('@utils/logger').logger);
      
      // Act
      const result = await alertService.sendLowStockNotifications(mockItems);
      
      // Assert
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'No low stock items to send notifications for'
      );
    });
  });
}); 
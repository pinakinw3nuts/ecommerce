import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InventoryService, StockAdjustmentParams, MovementType } from '@services/inventory.service';
import { Inventory } from '@entities/Inventory';
import { Repository } from 'typeorm';

// Mock the dataSource and repositories
vi.mock('@config/dataSource', () => {
  const mockInventoryRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
  };
  
  const mockMovementRepo = {
    save: vi.fn(),
    create: vi.fn(),
  };
  
  const mockLocationRepo = {
    findOne: vi.fn(),
  };
  
  return {
    dataSource: {
      getRepository: vi.fn((entity) => {
        if (entity.name === 'Inventory') return mockInventoryRepo;
        if (entity.name === 'InventoryMovement') return mockMovementRepo;
        if (entity.name === 'Location') return mockLocationRepo;
        return {};
      }),
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

describe('InventoryService - Stock Adjustment', () => {
  let inventoryService: InventoryService;
  let mockInventoryRepo: Repository<Inventory>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    inventoryService = new InventoryService();
    
    // Get reference to the mocked repository
    mockInventoryRepo = (inventoryService as any).inventoryRepository;
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('adjustStock', () => {
    const mockInventory = {
      id: '123',
      productId: 'prod-123',
      sku: 'P123456',
      stock: 10,
      threshold: 5,
      isLowStock: false,
      location: 'warehouse-1',
      save: vi.fn(),
    };
    
    it('should increase stock for STOCK_IN movement', async () => {
      // Arrange
      const params: StockAdjustmentParams = {
        inventoryId: '123',
        quantity: 5,
        type: MovementType.STOCK_IN,
        reason: 'Restock',
      };
      
      mockInventoryRepo.findOne = vi.fn().mockResolvedValue(mockInventory);
      mockInventoryRepo.save = vi.fn().mockImplementation(item => Promise.resolve(item));
      
      // Act
      const result = await inventoryService.adjustStock(params);
      
      // Assert
      expect(result.stock).toBe(15); // 10 + 5
      expect(result.isLowStock).toBe(false);
      expect(result.lastRestockedAt).toBeDefined();
      expect(mockInventoryRepo.save).toHaveBeenCalled();
    });
    
    it('should decrease stock for STOCK_OUT movement', async () => {
      // Arrange
      const params: StockAdjustmentParams = {
        inventoryId: '123',
        quantity: 3,
        type: MovementType.STOCK_OUT,
        reason: 'Order fulfilled',
      };
      
      mockInventoryRepo.findOne = vi.fn().mockResolvedValue({ ...mockInventory, stock: 10 });
      mockInventoryRepo.save = vi.fn().mockImplementation(item => Promise.resolve(item));
      
      // Act
      const result = await inventoryService.adjustStock(params);
      
      // Assert
      expect(result.stock).toBe(7); // 10 - 3
      expect(result.isLowStock).toBe(false); // 7 > threshold (5)
      expect(mockInventoryRepo.save).toHaveBeenCalled();
    });
    
    it('should throw error if STOCK_OUT would result in negative stock', async () => {
      // Arrange
      const params: StockAdjustmentParams = {
        inventoryId: '123',
        quantity: 15,
        type: MovementType.STOCK_OUT,
        reason: 'Order fulfilled',
      };
      
      mockInventoryRepo.findOne = vi.fn().mockResolvedValue({ ...mockInventory, stock: 10 });
      
      // Act & Assert
      await expect(inventoryService.adjustStock(params)).rejects.toThrow('Insufficient stock');
      expect(mockInventoryRepo.save).not.toHaveBeenCalled();
    });
    
    it('should update isLowStock flag when stock falls below threshold', async () => {
      // Arrange
      const params: StockAdjustmentParams = {
        inventoryId: '123',
        quantity: 7,
        type: MovementType.STOCK_OUT,
        reason: 'Order fulfilled',
      };
      
      mockInventoryRepo.findOne = vi.fn().mockResolvedValue({ 
        ...mockInventory, 
        stock: 10,
        threshold: 5,
        isLowStock: false
      });
      mockInventoryRepo.save = vi.fn().mockImplementation(item => Promise.resolve(item));
      
      // Act
      const result = await inventoryService.adjustStock(params);
      
      // Assert
      expect(result.stock).toBe(3); // 10 - 7
      expect(result.isLowStock).toBe(true); // 3 < threshold (5)
      expect(mockInventoryRepo.save).toHaveBeenCalled();
    });
    
    it('should handle ADJUSTMENT type with positive quantity', async () => {
      // Arrange
      const params: StockAdjustmentParams = {
        inventoryId: '123',
        quantity: 2,
        type: MovementType.ADJUSTMENT,
        reason: 'Inventory correction',
      };
      
      mockInventoryRepo.findOne = vi.fn().mockResolvedValue({ ...mockInventory, stock: 10 });
      mockInventoryRepo.save = vi.fn().mockImplementation(item => Promise.resolve(item));
      
      // Act
      const result = await inventoryService.adjustStock(params);
      
      // Assert
      expect(result.stock).toBe(12); // 10 + 2
      expect(mockInventoryRepo.save).toHaveBeenCalled();
    });
    
    it('should handle ADJUSTMENT type with negative quantity', async () => {
      // Arrange
      const params: StockAdjustmentParams = {
        inventoryId: '123',
        quantity: -4,
        type: MovementType.ADJUSTMENT,
        reason: 'Inventory correction',
      };
      
      mockInventoryRepo.findOne = vi.fn().mockResolvedValue({ ...mockInventory, stock: 10 });
      mockInventoryRepo.save = vi.fn().mockImplementation(item => Promise.resolve(item));
      
      // Act
      const result = await inventoryService.adjustStock(params);
      
      // Assert
      expect(result.stock).toBe(6); // 10 - 4
      expect(mockInventoryRepo.save).toHaveBeenCalled();
    });
    
    it('should throw error if inventory not found', async () => {
      // Arrange
      const params: StockAdjustmentParams = {
        inventoryId: 'non-existent',
        quantity: 5,
        type: MovementType.STOCK_IN,
        reason: 'Restock',
      };
      
      mockInventoryRepo.findOne = vi.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(inventoryService.adjustStock(params)).rejects.toThrow('Inventory with ID non-existent not found');
      expect(mockInventoryRepo.save).not.toHaveBeenCalled();
    });
  });
}); 
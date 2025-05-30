import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InventoryService, CreateInventoryParams } from '@services/inventory.service';
import { Inventory } from '@entities/Inventory';
import { Repository } from 'typeorm';

// Mock the dataSource and repositories
vi.mock('@config/dataSource', () => {
  const mockInventoryRepo = {
    findOne: vi.fn(),
    find: vi.fn(),
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

// Mock SKU generation
vi.mock('@utils/sku', () => ({
  generateSku: vi.fn((productId) => `P${productId.substring(0, 6)}`),
  validateSku: vi.fn(() => true),
}));

describe('InventoryService - Bulk Sync', () => {
  let inventoryService: InventoryService;
  let mockInventoryRepo: any;
  let mockLocationRepo: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    inventoryService = new InventoryService();
    
    // Get reference to the mocked repositories
    mockInventoryRepo = (inventoryService as any).inventoryRepository;
    mockLocationRepo = (inventoryService as any).locationRepository;
    
    // Default mock for location check
    mockLocationRepo.findOne = vi.fn().mockResolvedValue({ id: 'loc-1', name: 'warehouse-1' });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  // Mock implementation for createInventory
  const setupCreateInventoryMock = () => {
    (inventoryService.createInventory as any) = vi.fn().mockImplementation(
      (params: CreateInventoryParams) => Promise.resolve({
        id: `inv-${Math.random().toString(36).substring(2, 9)}`,
        ...params,
        isLowStock: params.stock <= (params.threshold || 5),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  };
  
  // Mock implementation for updateInventory
  const setupUpdateInventoryMock = () => {
    (inventoryService.updateInventory as any) = vi.fn().mockImplementation(
      (id: string, updates: any) => Promise.resolve({
        id,
        ...updates,
        isLowStock: updates.stock ? updates.stock <= 5 : false,
        updatedAt: new Date(),
      })
    );
  };
  
  // Mock implementation for getInventoryBySku
  const setupGetInventoryBySkuMock = (existingItems: any[] = []) => {
    (inventoryService.getInventoryBySku as any) = vi.fn().mockImplementation(
      (sku: string, location?: string) => {
        const filtered = existingItems.filter(item => {
          const skuMatch = item.sku === sku;
          return location ? skuMatch && item.location === location : skuMatch;
        });
        return Promise.resolve(filtered);
      }
    );
  };
  
  // Mock implementation for generateSku
  const setupGenerateSkuMock = () => {
    (inventoryService.generateSku as any) = vi.fn().mockImplementation(
      (productId: string) => Promise.resolve(`P${productId.substring(0, 6)}`)
    );
  };
  
  describe('bulkSyncInventory', () => {
    it('should create new inventory items when they do not exist', async () => {
      // Arrange
      const items = [
        {
          productId: 'prod-123',
          stock: 10,
          location: 'warehouse-1',
          threshold: 5,
        },
        {
          productId: 'prod-456',
          variantId: 'var-789',
          stock: 15,
          location: 'warehouse-2',
          threshold: 3,
        },
      ];
      
      setupGetInventoryBySkuMock([]);
      setupGenerateSkuMock();
      setupCreateInventoryMock();
      
      // Act
      const result = await inventoryService.bulkSyncInventory({
        items,
        createMissing: true,
        updateExisting: true,
      });
      
      // Assert
      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      
      // Verify createInventory was called for each item
      expect(inventoryService.createInventory).toHaveBeenCalledTimes(2);
      expect(inventoryService.updateInventory).not.toHaveBeenCalled();
    });
    
    it('should update existing inventory items', async () => {
      // Arrange
      const existingItems = [
        {
          id: 'inv-1',
          productId: 'prod-123',
          sku: 'P123456',
          stock: 10,
          location: 'warehouse-1',
          threshold: 5,
        },
      ];
      
      const items = [
        {
          productId: 'prod-123',
          sku: 'P123456',
          stock: 20,
          location: 'warehouse-1',
          threshold: 8,
        },
      ];
      
      setupGetInventoryBySkuMock(existingItems);
      setupUpdateInventoryMock();
      
      // Act
      const result = await inventoryService.bulkSyncInventory({
        items,
        createMissing: true,
        updateExisting: true,
      });
      
      // Assert
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.failed).toBe(0);
      
      // Verify updateInventory was called with correct params
      expect(inventoryService.updateInventory).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({
          stock: 20,
          threshold: 8,
        })
      );
      expect(inventoryService.createInventory).not.toHaveBeenCalled();
    });
    
    it('should skip updates when updateExisting is false', async () => {
      // Arrange
      const existingItems = [
        {
          id: 'inv-1',
          productId: 'prod-123',
          sku: 'P123456',
          stock: 10,
          location: 'warehouse-1',
        },
      ];
      
      const items = [
        {
          productId: 'prod-123',
          sku: 'P123456',
          stock: 20,
          location: 'warehouse-1',
        },
      ];
      
      setupGetInventoryBySkuMock(existingItems);
      setupUpdateInventoryMock();
      
      // Act
      const result = await inventoryService.bulkSyncInventory({
        items,
        createMissing: true,
        updateExisting: false,
      });
      
      // Assert
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      
      // Verify neither create nor update was called
      expect(inventoryService.updateInventory).not.toHaveBeenCalled();
      expect(inventoryService.createInventory).not.toHaveBeenCalled();
    });
    
    it('should skip creation when createMissing is false', async () => {
      // Arrange
      const items = [
        {
          productId: 'prod-123',
          stock: 10,
          location: 'warehouse-1',
        },
      ];
      
      setupGetInventoryBySkuMock([]);
      setupCreateInventoryMock();
      
      // Act
      const result = await inventoryService.bulkSyncInventory({
        items,
        createMissing: false,
        updateExisting: true,
      });
      
      // Assert
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      
      // Verify neither create nor update was called
      expect(inventoryService.createInventory).not.toHaveBeenCalled();
      expect(inventoryService.updateInventory).not.toHaveBeenCalled();
    });
    
    it('should handle errors during sync and continue processing', async () => {
      // Arrange
      const items = [
        {
          productId: 'prod-123',
          stock: 10,
          location: 'warehouse-1',
        },
        {
          productId: 'prod-456',
          stock: 15,
          location: 'invalid-location', // This will cause an error
        },
        {
          productId: 'prod-789',
          stock: 20,
          location: 'warehouse-2',
        },
      ];
      
      setupGetInventoryBySkuMock([]);
      setupGenerateSkuMock();
      
      // Mock createInventory to succeed for some items and fail for others
      (inventoryService.createInventory as any) = vi.fn().mockImplementation(
        (params: CreateInventoryParams) => {
          if (params.location === 'invalid-location') {
            return Promise.reject(new Error('Location not found: invalid-location'));
          }
          
          return Promise.resolve({
            id: `inv-${Math.random().toString(36).substring(2, 9)}`,
            ...params,
            isLowStock: params.stock <= (params.threshold || 5),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      );
      
      // Act
      const result = await inventoryService.bulkSyncInventory({
        items,
        createMissing: true,
        updateExisting: true,
      });
      
      // Assert
      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Location not found');
      
      // Verify createInventory was called for each item
      expect(inventoryService.createInventory).toHaveBeenCalledTimes(3);
    });
    
    it('should handle mixed operations - create new and update existing items', async () => {
      // Arrange
      const existingItems = [
        {
          id: 'inv-1',
          productId: 'prod-123',
          sku: 'P123456',
          stock: 10,
          location: 'warehouse-1',
        },
      ];
      
      const items = [
        {
          // Existing item - should update
          productId: 'prod-123',
          sku: 'P123456',
          stock: 20,
          location: 'warehouse-1',
        },
        {
          // New item - should create
          productId: 'prod-456',
          stock: 15,
          location: 'warehouse-2',
        },
      ];
      
      setupGetInventoryBySkuMock(existingItems);
      setupGenerateSkuMock();
      setupCreateInventoryMock();
      setupUpdateInventoryMock();
      
      // Act
      const result = await inventoryService.bulkSyncInventory({
        items,
        createMissing: true,
        updateExisting: true,
      });
      
      // Assert
      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.failed).toBe(0);
      
      // Verify both create and update were called
      expect(inventoryService.createInventory).toHaveBeenCalledTimes(1);
      expect(inventoryService.updateInventory).toHaveBeenCalledTimes(1);
    });
  });
}); 
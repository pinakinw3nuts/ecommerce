import { Repository, In, FindOptionsWhere } from 'typeorm';
import { dataSource } from '../config/dataSource';
import { Inventory, InventoryMovement, Location } from '../entities';
import { logger } from '../utils/logger';
import { generateSku, validateSku } from '../utils/sku';

// Import the type from the entity
import { MovementType } from '../entities/InventoryMovement';

// Define MovementType values as constants that match the type definition
export const MovementTypes: Record<string, MovementType> = {
  INITIAL: 'INITIAL',
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN'
};

/**
 * Interface for stock adjustment parameters
 */
export interface StockAdjustmentParams {
  inventoryId: string;
  quantity: number;
  type: MovementType;
  reason?: string;
  userId?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  previousStock?: number;
  newStock?: number;
}

/**
 * Interface for creating inventory item
 */
export interface CreateInventoryParams {
  productId: string;
  variantId?: string;
  sku?: string;
  stock: number;
  location: string;
  threshold?: number;
  metadata?: Record<string, any>;
}

/**
 * Interface for updating inventory item
 */
export interface UpdateInventoryParams {
  stock?: number;
  threshold?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Interface for bulk update inventory items
 */
export interface BulkUpdateInventoryParams {
  inventoryIds: string[];
  updates: Omit<UpdateInventoryParams, 'stock'>;
}

/**
 * Interface for inventory filter options
 */
export interface InventoryFilterOptions {
  productId?: string;
  productIds?: string[];
  variantId?: string;
  variantIds?: string[];
  sku?: string;
  skus?: string[];
  location?: string;
  locations?: string[];
  isLowStock?: boolean;
  isActive?: boolean;
}

/**
 * Service for managing inventory operations
 */
export class InventoryService {
  private inventoryRepository: Repository<Inventory>;
  private movementRepository: Repository<InventoryMovement>;
  private locationRepository: Repository<Location>;
  
  constructor() {
    this.inventoryRepository = dataSource.getRepository(Inventory);
    this.movementRepository = dataSource.getRepository(InventoryMovement);
    this.locationRepository = dataSource.getRepository(Location);
  }

  /**
   * Generate a SKU for a product/variant
   */
  async generateSku(productId: string, variantId?: string): Promise<string> {
    return generateSku(productId, variantId);
  }

  /**
   * Create a new inventory item
   * 
   * @param params - Parameters for creating inventory
   * @returns The created inventory item
   */
  async createInventory(params: CreateInventoryParams): Promise<Inventory> {
    const { productId, variantId, stock, location, threshold = 5, metadata } = params;
    
    // Generate SKU if not provided
    const sku = params.sku || await this.generateSku(productId, variantId);
    
    // Check if location exists
    const locationExists = await this.locationRepository.findOne({ where: { name: location } });
    if (!locationExists) {
      throw new Error(`Location not found: ${location}`);
    }
    
    // Check if inventory already exists for this SKU and location
    const existingInventory = await this.inventoryRepository.findOne({
      where: {
        sku,
        location
      }
    });
    
    if (existingInventory) {
      throw new Error(`Inventory already exists for SKU ${sku} at location ${location}`);
    }
    
    // Create new inventory item
    const inventory = this.inventoryRepository.create({
      productId,
      variantId,
      sku,
      stock,
      location,
      threshold,
      metadata,
      isLowStock: stock <= threshold,
      isActive: true
    });

    const savedInventory = await this.inventoryRepository.save(inventory);
    logger.info({ inventoryId: savedInventory.id }, 'Inventory created successfully');

    // Create initial movement record if stock > 0
    if (params.stock > 0) {
      await this.createMovementRecord({
        inventoryId: savedInventory.id,
        quantity: params.stock,
        type: MovementTypes.STOCK_IN as MovementType,
        reason: 'Initial stock'
      });
    }

    return savedInventory;
  }

  /**
   * Get inventory by ID
   * 
   * @param id - Inventory ID
   * @returns The inventory item or null if not found
   */
  async getInventoryById(id: string): Promise<Inventory | null> {
    try {
      return await this.inventoryRepository.findOne({ where: { id } });
    } catch (error) {
      logger.error({ error, id }, 'Error getting inventory by ID');
      throw error;
    }
  }

  /**
   * Get inventory by SKU and optionally location
   * 
   * @param sku - The SKU to look up
   * @param location - Optional location code
   * @returns The inventory items matching the criteria
   */
  async getInventoryBySku(sku: string, location?: string): Promise<Inventory[]> {
    // Validate SKU
    if (!validateSku(sku)) {
      throw new Error(`Invalid SKU format: ${sku}`);
    }

    // Build query
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.sku = :sku', { sku });

    // Add location filter if provided
    if (location) {
      query.andWhere('inventory.location = :location', { location });
    }

    // Execute query
    return query.getMany();
  }

  /**
   * Get inventory items by product ID
   * 
   * @param productId - Product ID
   * @returns Inventory items for the product
   */
  async getInventoryByProductId(productId: string): Promise<Inventory[]> {
    try {
      return await this.inventoryRepository.find({ where: { productId } });
    } catch (error) {
      logger.error({ error, productId }, 'Error getting inventory by product ID');
      throw error;
    }
  }

  /**
   * Filter inventory items by various criteria
   * 
   * @param filters - Filter options
   * @returns Filtered inventory items
   */
  async filterInventory(filters: InventoryFilterOptions): Promise<Inventory[]> {
    try {
      const where: FindOptionsWhere<Inventory> = {};
      
      if (filters.productId) where.productId = filters.productId;
      if (filters.productIds) where.productId = In(filters.productIds);
      if (filters.variantId) where.variantId = filters.variantId;
      if (filters.variantIds) where.variantId = In(filters.variantIds);
      if (filters.sku) where.sku = filters.sku;
      if (filters.skus) where.sku = In(filters.skus);
      if (filters.location) where.location = filters.location;
      if (filters.locations) where.location = In(filters.locations);
      if (filters.isLowStock !== undefined) where.isLowStock = filters.isLowStock;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      
      return await this.inventoryRepository.find({ where });
    } catch (error) {
      logger.error({ error, filters }, 'Error filtering inventory');
      throw error;
    }
  }

  /**
   * Update an inventory item
   * 
   * @param id - Inventory ID
   * @param updates - Update parameters
   * @returns The updated inventory item
   */
  async updateInventory(id: string, updates: UpdateInventoryParams): Promise<Inventory> {
    try {
      const inventory = await this.inventoryRepository.findOne({ where: { id } });
      
      if (!inventory) {
        throw new Error(`Inventory with ID ${id} not found`);
      }
      
      // Apply updates
      if (updates.threshold !== undefined) {
        inventory.threshold = updates.threshold;
        // Update low stock status based on new threshold
        inventory.isLowStock = inventory.stock <= updates.threshold;
      }
      
      if (updates.isActive !== undefined) {
        inventory.isActive = updates.isActive;
      }
      
      if (updates.metadata) {
        inventory.metadata = { ...inventory.metadata, ...updates.metadata };
      }
      
      // Handle stock updates separately to create movement record
      if (updates.stock !== undefined && updates.stock !== inventory.stock) {
        await this.adjustStock({
          inventoryId: id,
          quantity: updates.stock - inventory.stock,
          type: MovementTypes.ADJUSTMENT as MovementType,
          reason: 'Manual update'
        });
        
        // Stock is updated by adjustStock, so we don't need to update it here
      }
      
      const updatedInventory = await this.inventoryRepository.save(inventory);
      logger.info({ inventoryId: id }, 'Inventory updated successfully');
      
      return updatedInventory;
    } catch (error) {
      logger.error({ error, id, updates }, 'Error updating inventory');
      throw error;
    }
  }

  /**
   * Bulk update multiple inventory items
   * 
   * @param params - Bulk update parameters
   * @returns The number of updated items
   */
  async bulkUpdateInventory(params: BulkUpdateInventoryParams): Promise<number> {
    try {
      const result = await this.inventoryRepository.update(
        { id: In(params.inventoryIds) },
        params.updates
      );
      
      logger.info({ 
        count: result.affected,
        inventoryIds: params.inventoryIds
      }, 'Bulk inventory update completed');
      
      return result.affected || 0;
    } catch (error) {
      logger.error({ error, params }, 'Error during bulk inventory update');
      throw error;
    }
  }

  /**
   * Adjust inventory stock (increase or decrease)
   * 
   * @param params - Stock adjustment parameters
   * @returns The updated inventory item
   */
  async adjustStock(params: StockAdjustmentParams): Promise<Inventory> {
    try {
      const inventory = await this.inventoryRepository.findOne({
        where: { id: params.inventoryId }
      });
      
      if (!inventory) {
        throw new Error(`Inventory with ID ${params.inventoryId} not found`);
      }
      
      const previousStock = inventory.stock;
      let newStock = previousStock;
      
      // Calculate new stock based on movement type
      const movementType = params.type as MovementType;
      switch (movementType) {
        case MovementTypes.STOCK_IN:
          newStock = previousStock + params.quantity;
          break;
        case MovementTypes.STOCK_OUT:
          if (previousStock < params.quantity) {
            throw new Error(`Insufficient stock for SKU ${inventory.sku}. Current stock: ${previousStock}, Requested: ${params.quantity}`);
          }
          newStock = previousStock - params.quantity;
          break;
        case MovementTypes.ADJUSTMENT:
          newStock = previousStock + params.quantity; // Can be positive or negative
          break;
        case MovementTypes.RETURN:
          // Return adds to stock
          newStock = previousStock + params.quantity;
          break;
        default:
          newStock = previousStock;
          logger.warn({ type: params.type }, 'Unknown movement type, stock unchanged');
      }
      
      // Update stock if it changed
      if (newStock !== previousStock) {
        inventory.stock = newStock;
        inventory.isLowStock = newStock <= inventory.threshold;
        
        // Update lastRestockedAt for stock increases
        if (newStock > previousStock) {
          inventory.lastRestockedAt = new Date();
        }
      }
      
      // Save the updated inventory
      const updatedInventory = await this.inventoryRepository.save(inventory);
      
      // Create movement record
      await this.createMovementRecord({
        inventoryId: inventory.id,
        quantity: Math.abs(params.quantity),
        type: MovementTypes.ADJUSTMENT as MovementType,
        reason: params.reason || params.type,
        previousStock: previousStock,
        newStock: newStock,
        metadata: {
          updatedBy: 'system',
          updateType: 'manual'
        }
      });
      
      // Check for low stock and log warning if needed
      if (updatedInventory.isLowStock) {
        logger.warn({
          inventoryId: updatedInventory.id,
          sku: updatedInventory.sku,
          location: updatedInventory.location,
          stock: updatedInventory.stock,
          threshold: updatedInventory.threshold
        }, 'Low stock warning');
      }
      
      return updatedInventory;
    } catch (error) {
      logger.error({ error, params }, 'Error adjusting stock');
      throw error;
    }
  }

  /**
   * Create a movement record for inventory
   */
  private async createMovementRecord(params: StockAdjustmentParams): Promise<InventoryMovement> {
    const { inventoryId, quantity, type, reason, previousStock, newStock: providedNewStock } = params;
    
    // Get inventory if not provided with previous stock
    const inventory = await this.inventoryRepository.findOne({ where: { id: inventoryId } });
    if (!inventory) {
      throw new Error(`Inventory not found with ID: ${inventoryId}`);
    }
    
    // Use provided previous stock or current inventory stock
    const prevStock = previousStock !== undefined ? previousStock : inventory.stock;
    
    // Calculate new stock if not provided
    const newStock = providedNewStock !== undefined 
      ? providedNewStock 
      : prevStock + (type === MovementTypes.STOCK_OUT ? -quantity : quantity);
    
    // Create movement record
    const movement = this.movementRepository.create({
      inventoryId,
      type: type as MovementType,
      quantity,
      previousStock: prevStock,
      newStock,
      reference: `${reason || type} - ${new Date().toISOString()}`,
      metadata: params.metadata || {}
    });
    
    // Save and return the movement record
    return this.movementRepository.save(movement);
  }

  /**
   * Get inventory items with stock below threshold
   * 
   * @returns Low stock inventory items
   */
  async getLowStockItems(): Promise<Inventory[]> {
    try {
      return await this.inventoryRepository.find({
        where: { isLowStock: true, isActive: true }
      });
    } catch (error) {
      logger.error({ error }, 'Error getting low stock items');
      throw error;
    }
  }

  /**
   * Check and update low stock status for all inventory items
   * 
   * @returns Number of items updated
   */
  async updateLowStockStatus(): Promise<number> {
    try {
      // Find all items where stock <= threshold but isLowStock is false
      const itemsToUpdate = await this.inventoryRepository.find({
        where: {
          isLowStock: false,
          isActive: true
        }
      });
      
      let updatedCount = 0;
      
      for (const item of itemsToUpdate) {
        if (item.stock <= item.threshold) {
          item.isLowStock = true;
          await this.inventoryRepository.save(item);
          updatedCount++;
          
          logger.warn({
            inventoryId: item.id,
            sku: item.sku,
            location: item.location,
            stock: item.stock,
            threshold: item.threshold
          }, 'Low stock status updated');
        }
      }
      
      return updatedCount;
    } catch (error) {
      logger.error({ error }, 'Error updating low stock status');
      throw error;
    }
  }

  /**
   * Get inventory movement history for an item
   * 
   * @param inventoryId - Inventory ID
   * @param limit - Maximum number of records to return
   * @returns Movement history records
   */
  async getInventoryMovementHistory(inventoryId: string, limit = 50): Promise<InventoryMovement[]> {
    try {
      return await this.movementRepository.find({
        where: { inventoryId },
        order: { createdAt: 'DESC' },
        take: limit
      });
    } catch (error) {
      logger.error({ error, inventoryId }, 'Error getting inventory movement history');
      throw error;
    }
  }
} 
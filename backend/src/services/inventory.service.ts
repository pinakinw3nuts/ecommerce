import { Repository, In, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Inventory } from '../entities/Inventory';
import { InventoryMovement } from '../entities/InventoryMovement';
import { MovementType } from '../entities/InventoryMovement';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { logger } from '../utils/logger';

export interface CreateInventoryParams {
  productId: string;
  variantId?: string;
  sku?: string;
  stock: number;
  location: string;
  threshold?: number;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryParams {
  stock?: number;
  threshold?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface StockAdjustmentParams {
  inventoryId: string;
  quantity: number;
  type: MovementType;
  reason: string;
  metadata?: Record<string, any>;
  previousStock?: number;
  newStock?: number;
}

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

export interface InventoryListOptions {
  page?: number;
  limit?: number;
  filters?: InventoryFilterOptions;
  sortBy?: keyof Inventory;
  sortOrder?: 'ASC' | 'DESC';
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalStockValue: number;
  locations: string[];
}

export class InventoryService {
  private inventoryRepo: Repository<Inventory>;
  private movementRepo: Repository<InventoryMovement>;
  private productRepo: Repository<Product>;
  private variantRepo: Repository<ProductVariant>;

  constructor() {
    this.inventoryRepo = AppDataSource.getRepository(Inventory);
    this.movementRepo = AppDataSource.getRepository(InventoryMovement);
    this.productRepo = AppDataSource.getRepository(Product);
    this.variantRepo = AppDataSource.getRepository(ProductVariant);
  }

  /**
   * Create a new inventory item
   */
  async createInventory(params: CreateInventoryParams): Promise<Inventory> {
    const { productId, variantId, stock, location, threshold = 5, metadata } = params;
    
    logger.info('Creating inventory item:', { productId, variantId, location, stock });

    // Generate SKU if not provided
    const sku = params.sku || await this.generateSku(productId, variantId);
    
    // Validate product exists
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Validate variant exists if provided
    if (variantId) {
      const variant = await this.variantRepo.findOne({ where: { id: variantId, product: { id: productId } } });
      if (!variant) {
        throw new Error(`Product variant not found: ${variantId}`);
      }
    }

    // Check if inventory already exists for this SKU and location
    const existingInventory = await this.inventoryRepo.findOne({
      where: { sku, location }
    });

    if (existingInventory) {
      throw new Error(`Inventory already exists for SKU ${sku} at location ${location}`);
    }

    // Create new inventory item
    const inventory = this.inventoryRepo.create({
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

    const savedInventory = await this.inventoryRepo.save(inventory);
    logger.info('Inventory created successfully:', { inventoryId: savedInventory.id });

    // Create initial movement record if stock > 0
    if (stock > 0) {
      await this.createMovementRecord({
        inventoryId: savedInventory.id,
        quantity: stock,
        type: MovementType.INITIAL,
        reason: 'Initial stock'
      });
    }

    return savedInventory;
  }

  /**
   * Get inventory by ID
   */
  async getInventoryById(id: string): Promise<Inventory | null> {
    logger.info('Getting inventory by ID:', { id });

    try {
      const inventory = await this.inventoryRepo.findOne({
        where: { id },
        relations: ['product', 'variant', 'movements']
      });

      if (!inventory) {
        logger.warn('Inventory not found by ID:', { id });
        return null;
      }

      return inventory;
    } catch (error) {
      logger.error('Error getting inventory by ID:', error);
      throw error;
    }
  }

  /**
   * Get inventory by SKU and optionally location
   */
  async getInventoryBySku(sku: string, location?: string): Promise<Inventory[]> {
    logger.info('Getting inventory by SKU:', { sku, location });

    try {
      const queryBuilder = this.inventoryRepo
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .leftJoinAndSelect('inventory.variant', 'variant')
        .where('inventory.sku = :sku', { sku });

      if (location) {
        queryBuilder.andWhere('inventory.location = :location', { location });
      }

      return await queryBuilder.getMany();
    } catch (error) {
      logger.error('Error getting inventory by SKU:', error);
      throw error;
    }
  }

  /**
   * Filter inventory items by various criteria
   */
  async filterInventory(filters: InventoryFilterOptions): Promise<Inventory[]> {
    logger.info('Filtering inventory:', filters);

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
      
      return await this.inventoryRepo.find({ 
        where,
        relations: ['product', 'variant']
      });
    } catch (error) {
      logger.error('Error filtering inventory:', error);
      throw error;
    }
  }

  /**
   * List inventory with pagination and filtering
   */
  async listInventory(options: InventoryListOptions = {}) {
    const {
      page = 1,
      limit = 10,
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options;

    logger.info('Listing inventory:', { page, limit, filters });

    try {
      const queryBuilder = this.inventoryRepo
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .leftJoinAndSelect('inventory.variant', 'variant');

      // Apply filters
      if (filters.productId) {
        queryBuilder.andWhere('inventory.productId = :productId', { productId: filters.productId });
      }
      if (filters.variantId) {
        queryBuilder.andWhere('inventory.variantId = :variantId', { variantId: filters.variantId });
      }
      if (filters.sku) {
        queryBuilder.andWhere('inventory.sku ILIKE :sku', { sku: `%${filters.sku}%` });
      }
      if (filters.location) {
        queryBuilder.andWhere('inventory.location ILIKE :location', { location: `%${filters.location}%` });
      }
      if (filters.isLowStock !== undefined) {
        queryBuilder.andWhere('inventory.isLowStock = :isLowStock', { isLowStock: filters.isLowStock });
      }
      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('inventory.isActive = :isActive', { isActive: filters.isActive });
      }

      // Apply sorting
      queryBuilder.orderBy(`inventory.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [inventory, total] = await queryBuilder.getManyAndCount();

      logger.info('Inventory listed successfully:', { count: inventory.length, total });

      return {
        inventory,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error listing inventory:', error);
      throw error;
    }
  }

  /**
   * Update an inventory item
   */
  async updateInventory(id: string, updates: UpdateInventoryParams): Promise<Inventory> {
    logger.info('Updating inventory:', { id, updates });

    try {
      const inventory = await this.inventoryRepo.findOne({ where: { id } });
      
      if (!inventory) {
        throw new Error(`Inventory with ID ${id} not found`);
      }
      
      // Apply updates
      if (updates.threshold !== undefined) {
        inventory.threshold = updates.threshold;
        inventory.checkLowStock();
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
          type: MovementType.ADJUSTMENT,
          reason: 'Manual update'
        });
        
        // Stock is updated by adjustStock, so we don't need to update it here
      }
      
      const updatedInventory = await this.inventoryRepo.save(inventory);
      logger.info('Inventory updated successfully:', { id });
      
      return updatedInventory;
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Adjust inventory stock (increase or decrease)
   */
  async adjustStock(params: StockAdjustmentParams): Promise<Inventory> {
    logger.info('Adjusting inventory stock:', params);

    try {
      const inventory = await this.inventoryRepo.findOne({
        where: { id: params.inventoryId }
      });
      
      if (!inventory) {
        throw new Error(`Inventory with ID ${params.inventoryId} not found`);
      }
      
      const previousStock = inventory.stock;
      let newStock = previousStock;
      
      // Calculate new stock based on movement type
      switch (params.type) {
        case MovementType.STOCK_IN:
        case MovementType.RETURN:
        case MovementType.RELEASE:
          newStock = previousStock + params.quantity;
          break;
        case MovementType.STOCK_OUT:
        case MovementType.RESERVATION:
          if (previousStock < params.quantity) {
            throw new Error(`Insufficient stock for SKU ${inventory.sku}. Current stock: ${previousStock}, Requested: ${params.quantity}`);
          }
          newStock = previousStock - params.quantity;
          break;
        case MovementType.ADJUSTMENT:
          newStock = previousStock + params.quantity; // Can be positive or negative
          break;
        default:
          newStock = previousStock;
          logger.warn('Unknown movement type, stock unchanged:', { type: params.type });
      }
      
      // Update stock if it changed
      if (newStock !== previousStock) {
        inventory.updateStock(newStock);
        
        // Update lastRestockedAt for stock increases
        if (newStock > previousStock) {
          inventory.lastRestockedAt = new Date();
        }
        
        await this.inventoryRepo.save(inventory);
        
        // Create movement record
        await this.createMovementRecord({
          ...params,
          previousStock,
          newStock
        });
        
        logger.info('Stock adjusted successfully:', { 
          inventoryId: inventory.id, 
          previousStock, 
          newStock, 
          type: params.type 
        });
      }
      
      return inventory;
    } catch (error) {
      logger.error('Error adjusting inventory stock:', error);
      throw error;
    }
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(inventoryId: string, quantity: number, orderId?: string): Promise<boolean> {
    logger.info('Reserving stock:', { inventoryId, quantity, orderId });

    try {
      const inventory = await this.inventoryRepo.findOne({ where: { id: inventoryId } });
      
      if (!inventory) {
        throw new Error(`Inventory with ID ${inventoryId} not found`);
      }

      if (!inventory.hasSufficientStock(quantity)) {
        logger.warn('Insufficient stock for reservation:', { 
          inventoryId, 
          requested: quantity, 
          available: inventory.stock 
        });
        return false;
      }

      await this.adjustStock({
        inventoryId,
        quantity,
        type: MovementType.RESERVATION,
        reason: `Order reservation${orderId ? ` for order ${orderId}` : ''}`,
        metadata: { orderId }
      });

      return true;
    } catch (error) {
      logger.error('Error reserving stock:', error);
      throw error;
    }
  }

  /**
   * Release reserved stock
   */
  async releaseStock(inventoryId: string, quantity: number, orderId?: string): Promise<void> {
    logger.info('Releasing stock:', { inventoryId, quantity, orderId });

    try {
      await this.adjustStock({
        inventoryId,
        quantity,
        type: MovementType.RELEASE,
        reason: `Order cancellation${orderId ? ` for order ${orderId}` : ''}`,
        metadata: { orderId }
      });
    } catch (error) {
      logger.error('Error releasing stock:', error);
      throw error;
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(): Promise<Inventory[]> {
    logger.info('Getting low stock alerts');

    try {
      const lowStockItems = await this.inventoryRepo.find({
        where: { isLowStock: true, isActive: true },
        relations: ['product', 'variant'],
        order: { stock: 'ASC' }
      });

      logger.info('Low stock alerts retrieved:', { count: lowStockItems.length });
      return lowStockItems;
    } catch (error) {
      logger.error('Error getting low stock alerts:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<InventoryStats> {
    logger.info('Getting inventory statistics');

    try {
      const [totalItems, lowStockItems, outOfStockItems, locations] = await Promise.all([
        this.inventoryRepo.count({ where: { isActive: true } }),
        this.inventoryRepo.count({ where: { isLowStock: true, isActive: true } }),
        this.inventoryRepo.count({ where: { stock: 0, isActive: true } }),
        this.inventoryRepo
          .createQueryBuilder('inventory')
          .select('DISTINCT inventory.location', 'location')
          .where('inventory.isActive = :isActive', { isActive: true })
          .getRawMany()
      ]);

      // Calculate total stock value (simplified - would need product prices in real implementation)
      const totalStockValue = 0; // TODO: Implement with product prices

      const stats: InventoryStats = {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalStockValue,
        locations: locations.map(l => l.location)
      };

      logger.info('Inventory statistics retrieved:', stats);
      return stats;
    } catch (error) {
      logger.error('Error getting inventory statistics:', error);
      throw error;
    }
  }

  /**
   * Create a movement record for inventory
   */
  private async createMovementRecord(params: StockAdjustmentParams): Promise<InventoryMovement> {
    const { inventoryId, quantity, type, reason, previousStock, newStock: providedNewStock, metadata } = params;
    
    // Get inventory if not provided with previous stock
    const inventory = await this.inventoryRepo.findOne({ where: { id: inventoryId } });
    if (!inventory) {
      throw new Error(`Inventory not found with ID: ${inventoryId}`);
    }
    
    // Use provided previous stock or current inventory stock
    const prevStock = previousStock !== undefined ? previousStock : inventory.stock;
    
    // Calculate new stock if not provided
    const newStock = providedNewStock !== undefined 
      ? providedNewStock 
      : prevStock + (type === MovementType.STOCK_OUT || type === MovementType.RESERVATION ? -quantity : quantity);
    
    // Create movement record
    const movement = this.movementRepo.create({
      inventoryId,
      type,
      quantity,
      previousStock: prevStock,
      newStock,
      reference: `${reason} - ${new Date().toISOString()}`,
      metadata: metadata || {}
    });
    
    // Save and return the movement record
    return this.movementRepo.save(movement);
  }

  /**
   * Generate SKU for inventory item
   */
  private async generateSku(productId: string, variantId?: string): Promise<string> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const baseSku = product.slug.toUpperCase();
    const variantSuffix = variantId ? `-${variantId.slice(0, 8)}` : '';
    const timestamp = Date.now().toString(36);
    
    return `${baseSku}${variantSuffix}-${timestamp}`;
  }
} 
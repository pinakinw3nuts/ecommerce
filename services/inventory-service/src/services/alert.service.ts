import { Repository, In } from 'typeorm';
import { dataSource } from '../config/dataSource';
import { Inventory } from '../entities/Inventory';
import { logger } from '../utils/logger';

/**
 * Interface for inventory alert item
 */
export interface InventoryAlertItem {
  id: string;
  productId: string;
  variantId?: string | null;
  sku: string;
  stock: number;
  threshold: number;
  location: string;
  metadata?: Record<string, any>;
  lastRestockedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for alert notification options
 */
export interface AlertNotificationOptions {
  notifyEmail?: boolean;
  notifyWebhook?: boolean;
  emailRecipients?: string[];
  webhookUrl?: string;
}

/**
 * Service for inventory alerts and notifications
 */
export class AlertService {
  private inventoryRepository: Repository<Inventory>;
  
  constructor() {
    this.inventoryRepository = dataSource.getRepository(Inventory);
  }

  /**
   * Check for inventory items that breach their threshold
   */
  async checkThresholdBreaches(): Promise<{
    lowStock: InventoryAlertItem[];
    criticalLowStock: InventoryAlertItem[];
    outOfStock: InventoryAlertItem[];
  }> {
    try {
      // Get all active inventory items
      const inventoryItems = await this.inventoryRepository.find({
        where: {
          isActive: true
        }
      });

      // Categorize items
      const lowStock: InventoryAlertItem[] = [];
      const criticalLowStock: InventoryAlertItem[] = [];
      const outOfStock: InventoryAlertItem[] = [];

      for (const item of inventoryItems) {
        if (item.stock === 0) {
          outOfStock.push(item as unknown as InventoryAlertItem);
        } else if (item.stock <= item.threshold * 0.5) {
          criticalLowStock.push(item as unknown as InventoryAlertItem);
        } else if (item.stock <= item.threshold) {
          lowStock.push(item as unknown as InventoryAlertItem);
        }
      }

      return {
        lowStock,
        criticalLowStock,
        outOfStock
      };
    } catch (error) {
      logger.error({ error }, 'Error checking threshold breaches');
      throw error;
    }
  }

  /**
   * Get low stock items (stock <= threshold)
   */
  async getLowStockItems(): Promise<InventoryAlertItem[]> {
    try {
      const items = await this.inventoryRepository
        .createQueryBuilder('inventory')
        .where('inventory.isActive = :isActive', { isActive: true })
        .andWhere('inventory.stock <= inventory.threshold')
        .andWhere('inventory.stock > 0')
        .getMany();
        
      return items as unknown as InventoryAlertItem[];
    } catch (error) {
      logger.error({ error }, 'Error getting low stock items');
      throw error;
    }
  }

  /**
   * Get critical low stock items (stock <= threshold * 0.5)
   */
  async getCriticalLowStockItems(): Promise<InventoryAlertItem[]> {
    try {
      const items = await this.inventoryRepository
        .createQueryBuilder('inventory')
        .where('inventory.isActive = :isActive', { isActive: true })
        .andWhere('inventory.stock <= inventory.threshold * 0.5')
        .andWhere('inventory.stock > 0')
        .getMany();
        
      return items as unknown as InventoryAlertItem[];
    } catch (error) {
      logger.error({ error }, 'Error getting critical low stock items');
      throw error;
    }
  }

  /**
   * Get out of stock items (stock = 0)
   */
  async getOutOfStockItems(): Promise<InventoryAlertItem[]> {
    try {
      const items = await this.inventoryRepository
        .createQueryBuilder('inventory')
        .where('inventory.isActive = :isActive', { isActive: true })
        .andWhere('inventory.stock = 0')
        .getMany();
        
      return items as unknown as InventoryAlertItem[];
    } catch (error) {
      logger.error({ error }, 'Error getting out of stock items');
      throw error;
    }
  }

  /**
   * Get items not restocked in a specified number of days
   */
  async getItemsNotRestockedInDays(days: number): Promise<InventoryAlertItem[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const items = await this.inventoryRepository
        .createQueryBuilder('inventory')
        .where('inventory.isActive = :isActive', { isActive: true })
        .andWhere('inventory.lastRestockedAt < :cutoffDate OR inventory.lastRestockedAt IS NULL', { cutoffDate })
        .getMany();
        
      return items as unknown as InventoryAlertItem[];
    } catch (error) {
      logger.error({ error, days }, 'Error getting items not restocked in days');
      throw error;
    }
  }

  /**
   * Get inventory items needing restock based on threshold and current stock
   * 
   * @param options - Optional parameters for filtering
   * @returns List of inventory items needing restock
   */
  async getItemsNeedingRestock(options: { 
    productIds?: string[],
    locations?: string[],
    criticalOnly?: boolean
  } = {}): Promise<InventoryAlertItem[]> {
    try {
      const query: any = {
        isActive: true
      };
      
      // Filter by product IDs if provided
      if (options.productIds && options.productIds.length > 0) {
        query.productId = In(options.productIds);
      }
      
      // Filter by locations if provided
      if (options.locations && options.locations.length > 0) {
        query.location = In(options.locations);
      }
      
      // Get all active inventory items matching filters
      const items = await this.inventoryRepository.find({
        where: query
      });
      
      // Filter for items needing restock
      const needingRestock = items.filter(item => {
        if (options.criticalOnly) {
          // Critical items are below 50% of threshold
          return item.stock <= item.threshold * 0.5;
        } else {
          // Regular threshold breach
          return item.stock <= item.threshold;
        }
      });
      
      // Sort by stock level (lowest first)
      needingRestock.sort((a, b) => {
        // Calculate percentage of threshold
        const aPercentage = a.stock / a.threshold;
        const bPercentage = b.stock / b.threshold;
        
        // Sort by percentage (lowest first)
        return aPercentage - bPercentage;
      });
      
      return needingRestock as unknown as InventoryAlertItem[];
    } catch (error) {
      logger.error({ error, options }, 'Error getting items needing restock');
      throw error;
    }
  }

  /**
   * Group inventory items by location
   */
  private groupItemsByLocation(items: InventoryAlertItem[]): Record<string, InventoryAlertItem[]> {
    return items.reduce((acc: Record<string, InventoryAlertItem[]>, item) => {
      // Initialize array for this location if it doesn't exist
      if (!acc[item.location]) {
        acc[item.location] = [];
      }
      
      // Now we can safely push to the array
      acc[item.location]!.push(item);
      return acc;
    }, {});
  }

  /**
   * Send notifications about low stock items
   * 
   * @param items - Items to notify about
   * @param options - Notification options
   * @returns Success status
   */
  async sendLowStockNotifications(
    items: InventoryAlertItem[],
    options: AlertNotificationOptions = {}
  ): Promise<boolean> {
    try {
      if (items.length === 0) {
        logger.info('No low stock items to send notifications for');
        return true;
      }
      
      logger.info({
        itemCount: items.length,
        notifyEmail: options.notifyEmail,
        notifyWebhook: options.notifyWebhook
      }, 'Sending low stock notifications');
      
      // In a real implementation, this would send emails or webhook notifications
      // For now, we'll just log the notification
      
      const itemsByLocation = this.groupItemsByLocation(items);
      
      logger.info({
        locationCount: Object.keys(itemsByLocation).length,
        itemsByLocation: Object.entries(itemsByLocation).map(([location, items]) => ({
          location,
          count: items.length
        }))
      }, 'Low stock notification would be sent');
      
      return true;
    } catch (error) {
      logger.error({ error, itemCount: items.length }, 'Error sending low stock notifications');
      return false;
    }
  }
} 
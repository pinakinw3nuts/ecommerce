import { FastifyReply, FastifyRequest } from 'fastify';
import { InventoryService, CreateInventoryParams, UpdateInventoryParams } from '../services/inventory.service';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { logger } from '../utils/logger';
import { AlertService } from '../services/alert.service';

// Initialize services
const inventoryService = new InventoryService();
const alertService = new AlertService();

/**
 * Controller for inventory operations
 */
export class InventoryController {
  /**
   * Get inventory by SKU
   */
  async getInventoryBySku(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { sku } = request.params as { sku: string };
      const { location } = request.query as { location?: string };
      
      logger.info({ sku, location }, 'Getting inventory by SKU');
      
      const inventoryItems = await inventoryService.getInventoryBySku(sku, location);
      
      return reply.code(200).send(inventoryItems);
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error getting inventory by SKU');
      return reply.code(500).send({ 
        message: 'Error retrieving inventory',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create new inventory item
   */
  async createInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authRequest = request as AuthenticatedRequest;
      const inventoryData = request.body as CreateInventoryParams;
      
      logger.info({ 
        userId: authRequest.user?.id,
        productId: inventoryData.productId,
        sku: inventoryData.sku,
        location: inventoryData.location
      }, 'Creating new inventory item');
      
      const newInventory = await inventoryService.createInventory(inventoryData);
      
      return reply.code(201).send(newInventory);
    } catch (error) {
      logger.error({ error, body: request.body }, 'Error creating inventory item');
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({ 
          message: 'Inventory item already exists',
          error: error.message
        });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(404).send({ 
          message: 'Location not found',
          error: error.message
        });
      }
      
      return reply.code(500).send({ 
        message: 'Error creating inventory item',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update inventory by SKU
   */
  async updateInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { sku } = request.params as { sku: string };
      const { location } = request.query as { location?: string };
      const updates = request.body as UpdateInventoryParams;
      
      logger.info({ 
        userId: authRequest.user?.id,
        sku, 
        location, 
        updates 
      }, 'Updating inventory');
      
      // Get inventory items matching SKU and optional location
      const inventoryItems = await inventoryService.getInventoryBySku(sku, location);
      
      if (inventoryItems.length === 0) {
        return reply.code(404).send({ 
          message: `No inventory found for SKU: ${sku}${location ? ` at location: ${location}` : ''}`
        });
      }
      
      // Update each matching inventory item
      const updatedItems = [];
      for (const item of inventoryItems) {
        const updatedItem = await inventoryService.updateInventory(item.id, updates);
        updatedItems.push({
          id: updatedItem.id,
          sku: updatedItem.sku,
          location: updatedItem.location,
          stock: updatedItem.stock,
          isLowStock: updatedItem.isLowStock
        });
      }
      
      // Check for low stock after updates
      const lowStockItems = updatedItems.filter(item => item.isLowStock);
      if (lowStockItems.length > 0) {
        // This would trigger notifications in a real system
        logger.warn({ lowStockItems }, 'Low stock detected after update');
      }
      
      return reply.code(200).send({ 
        updated: updatedItems.length,
        items: updatedItems
      });
    } catch (error) {
      logger.error({ error, params: request.params, body: request.body }, 'Error updating inventory');
      return reply.code(500).send({ 
        message: 'Error updating inventory',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Bulk sync inventory
   */
  async bulkSyncInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { items, createMissing = true, updateExisting = true } = request.body as {
        items: CreateInventoryParams[];
        createMissing: boolean;
        updateExisting: boolean;
      };
      
      logger.info({ 
        userId: authRequest.user?.id,
        itemCount: items.length,
        createMissing,
        updateExisting
      }, 'Starting bulk inventory sync');
      
      const results = {
        created: 0,
        updated: 0,
        failed: 0,
        errors: [] as { index: number; sku: string; location: string; error: string }[]
      };
      
      // Process each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Skip if item is undefined
        if (!item) {
          results.failed++;
          results.errors.push({
            index: i,
            sku: 'unknown',
            location: 'unknown',
            error: 'Item is undefined'
          });
          continue;
        }
        
        try {
          // Generate SKU if not provided
          const sku = item.sku || await inventoryService.generateSku(item.productId, item.variantId);
          
          // Check if inventory exists
          const existingItems = await inventoryService.getInventoryBySku(sku, item.location);
          
          if (existingItems.length > 0 && existingItems[0]) {
            // Update existing inventory
            if (updateExisting) {
              await inventoryService.updateInventory(existingItems[0].id, {
                stock: item.stock,
                threshold: item.threshold,
                metadata: item.metadata
              });
              results.updated++;
            }
          } else {
            // Create new inventory
            if (createMissing) {
              // Create a type-safe copy with required fields
              const newItem: CreateInventoryParams = {
                productId: item.productId,
                location: item.location,
                stock: item.stock,
                threshold: item.threshold || 5, // Default threshold if not provided
                sku
              };
              
              // Add optional fields if they exist
              if (item.variantId) newItem.variantId = item.variantId;
              if (item.metadata) newItem.metadata = item.metadata;
              
              await inventoryService.createInventory(newItem);
              results.created++;
            }
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            index: i,
            sku: item?.sku || 'unknown',
            location: item?.location || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Check for low stock items after bulk sync
      const lowStockItems = await alertService.getLowStockItems();
      if (lowStockItems.length > 0) {
        logger.warn({ lowStockCount: lowStockItems.length }, 'Low stock items detected after bulk sync');
      }
      
      return reply.code(200).send(results);
    } catch (error) {
      logger.error({ error }, 'Error during bulk inventory sync');
      return reply.code(500).send({ 
        message: 'Error during bulk inventory sync',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
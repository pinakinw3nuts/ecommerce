import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InventoryService } from '../services/inventory.service';
import { MovementType } from '../entities/InventoryMovement';
import { requireUser, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

// Zod schemas for validation
const createInventorySchema = {
  type: 'object',
  required: ['productId', 'stock', 'location'],
  properties: {
    productId: { type: 'string', format: 'uuid' },
    variantId: { type: 'string', format: 'uuid' },
    sku: { type: 'string', maxLength: 20 },
    stock: { type: 'integer', minimum: 0 },
    location: { type: 'string', minLength: 1, maxLength: 100 },
    threshold: { type: 'integer', minimum: 0 },
    metadata: { type: 'object' }
  }
};

const updateInventorySchema = {
  type: 'object',
  properties: {
    stock: { type: 'integer', minimum: 0 },
    threshold: { type: 'integer', minimum: 0 },
    isActive: { type: 'boolean' },
    metadata: { type: 'object' }
  }
};

const adjustStockSchema = {
  type: 'object',
  required: ['quantity', 'type', 'reason'],
  properties: {
    quantity: { type: 'integer' },
    type: { 
      type: 'string', 
      enum: ['IN', 'OUT', 'ADJUSTMENT', 'RESERVATION', 'RELEASE', 'TRANSFER'] 
    },
    reason: { type: 'string', minLength: 1, maxLength: 255 },
    metadata: { type: 'object' }
  }
};

const listInventorySchema = {
  type: 'object',
  properties: {
    page: { type: 'string', default: '1' },
    limit: { type: 'string', default: '10' },
    productId: { type: 'string', format: 'uuid' },
    variantId: { type: 'string', format: 'uuid' },
    sku: { type: 'string' },
    location: { type: 'string' },
    isLowStock: { type: 'string' },
    isActive: { type: 'string' },
    sortBy: { type: 'string', default: 'createdAt' },
    sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
  }
};

const inventoryIdSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' }
  }
};

const skuSchema = {
  type: 'object',
  required: ['sku'],
  properties: {
    sku: { type: 'string', minLength: 1, maxLength: 20 }
  }
};

const reserveStockSchema = {
  type: 'object',
  required: ['quantity'],
  properties: {
    quantity: { type: 'integer', minimum: 1 },
    orderId: { type: 'string', format: 'uuid' }
  }
};

interface CreateInventoryRequest {
  Body: {
    productId: string;
    variantId?: string;
    sku?: string;
    stock: number;
    location: string;
    threshold?: number;
    metadata?: Record<string, any>;
  };
}

interface UpdateInventoryRequest {
  Params: {
    id: string;
  };
  Body: {
    stock?: number;
    threshold?: number;
    isActive?: boolean;
    metadata?: Record<string, any>;
  };
}

interface AdjustStockRequest {
  Params: {
    id: string;
  };
  Body: {
    quantity: number;
    type: string;
    reason: string;
    metadata?: Record<string, any>;
  };
}

interface ListInventoryRequest {
  Querystring: {
    page?: string;
    limit?: string;
    productId?: string;
    variantId?: string;
    sku?: string;
    location?: string;
    isLowStock?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

interface InventoryIdRequest {
  Params: {
    id: string;
  };
}

interface SkuRequest {
  Params: {
    sku: string;
  };
  Querystring: {
    location?: string;
  };
}

interface ReserveStockRequest {
  Params: {
    id: string;
  };
  Body: {
    quantity: number;
    orderId?: string;
  };
}

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

export default async function inventoryRoutes(fastify: FastifyInstance) {
  const inventoryService = new InventoryService();

  // POST /api/inventory - Create new inventory item
  fastify.post('/', {
    schema: {
      body: createInventorySchema,
    },
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;
      
      logger.info('Creating inventory item via API:', { 
        productId: data.productId,
        variantId: data.variantId,
        location: data.location,
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const inventory = await inventoryService.createInventory(data);

      reply.status(201).send({
        success: true,
        message: 'Inventory item created successfully',
        data: inventory.toJSON(),
      });
    } catch (error) {
      logger.error('Error creating inventory item via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to create inventory item',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/inventory - List inventory items
  fastify.get('/', {
    schema: {
      querystring: listInventorySchema,
    },
    preHandler: [requireUser()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      
      logger.info('Listing inventory via API:', { 
        page: query.page, 
        limit: query.limit,
        filters: {
          productId: query.productId,
          variantId: query.variantId,
          sku: query.sku,
          location: query.location,
          isLowStock: query.isLowStock,
          isActive: query.isActive,
        },
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const result = await inventoryService.listInventory({
        page: query.page,
        limit: query.limit,
        filters: {
          productId: query.productId,
          variantId: query.variantId,
          sku: query.sku,
          location: query.location,
          isLowStock: query.isLowStock,
          isActive: query.isActive,
        },
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder,
      });

      reply.status(200).send({
        success: true,
        data: {
          inventory: result.inventory.map(item => item.toJSON()),
          pagination: result.pagination,
        },
      });
    } catch (error) {
      logger.error('Error listing inventory via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to list inventory',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/inventory/:id - Get inventory by ID
  fastify.get('/:id', {
    schema: {
      params: inventoryIdSchema,
    },
    preHandler: [requireUser()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      
      logger.info('Getting inventory by ID via API:', { 
        id, 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const inventory = await inventoryService.getInventoryById(id);

      if (!inventory) {
        return reply.status(404).send({
          success: false,
          message: 'Inventory item not found',
          error: 'INVENTORY_NOT_FOUND',
        });
      }

      reply.status(200).send({
        success: true,
        data: inventory.toJSON(),
      });
    } catch (error) {
      logger.error('Error getting inventory by ID via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to get inventory item',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/inventory/sku/:sku - Get inventory by SKU
  fastify.get('/sku/:sku', {
    schema: {
      params: skuSchema,
      querystring: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        }
      },
    },
    preHandler: [requireUser()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sku } = request.params as any;
      const { location } = request.query as any;
      
      logger.info('Getting inventory by SKU via API:', { 
        sku, 
        location,
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const inventory = await inventoryService.getInventoryBySku(sku, location);

      reply.status(200).send({
        success: true,
        data: inventory.map(item => item.toJSON()),
      });
    } catch (error) {
      logger.error('Error getting inventory by SKU via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to get inventory by SKU',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // PUT /api/inventory/:id - Update inventory item
  fastify.put('/:id', {
    schema: {
      params: inventoryIdSchema,
      body: updateInventorySchema,
    },
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const updates = request.body as any;
      
      logger.info('Updating inventory via API:', { 
        id, 
        updates,
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const inventory = await inventoryService.updateInventory(id, updates);

      reply.status(200).send({
        success: true,
        message: 'Inventory item updated successfully',
        data: inventory.toJSON(),
      });
    } catch (error) {
      logger.error('Error updating inventory via API:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'Inventory item not found',
          error: 'INVENTORY_NOT_FOUND',
        });
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to update inventory item',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // POST /api/inventory/:id/adjust-stock - Adjust inventory stock
  fastify.post('/:id/adjust-stock', {
    schema: {
      params: inventoryIdSchema,
      body: adjustStockSchema,
    },
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const adjustment = request.body as any;
      
      logger.info('Adjusting inventory stock via API:', { 
        id, 
        adjustment,
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const inventory = await inventoryService.adjustStock({
        inventoryId: id,
        ...adjustment,
      });

      reply.status(200).send({
        success: true,
        message: 'Inventory stock adjusted successfully',
        data: inventory.toJSON(),
      });
    } catch (error) {
      logger.error('Error adjusting inventory stock via API:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'Inventory item not found',
          error: 'INVENTORY_NOT_FOUND',
        });
      }

      if (error instanceof Error && error.message.includes('Insufficient stock')) {
        return reply.status(400).send({
          success: false,
          message: 'Insufficient stock',
          error: 'INSUFFICIENT_STOCK',
        });
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to adjust inventory stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // POST /api/inventory/:id/reserve-stock - Reserve stock for order
  fastify.post('/:id/reserve-stock', {
    schema: {
      params: inventoryIdSchema,
      body: reserveStockSchema,
    },
    preHandler: [requireUser()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { quantity, orderId } = request.body as any;
      
      logger.info('Reserving inventory stock via API:', { 
        id, 
        quantity,
        orderId,
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const success = await inventoryService.reserveStock(id, quantity, orderId);

      if (!success) {
        return reply.status(400).send({
          success: false,
          message: 'Insufficient stock for reservation',
          error: 'INSUFFICIENT_STOCK',
        });
      }

      reply.status(200).send({
        success: true,
        message: 'Stock reserved successfully',
        data: { inventoryId: id, quantity, orderId },
      });
    } catch (error) {
      logger.error('Error reserving inventory stock via API:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'Inventory item not found',
          error: 'INVENTORY_NOT_FOUND',
        });
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to reserve stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // POST /api/inventory/:id/release-stock - Release reserved stock
  fastify.post('/:id/release-stock', {
    schema: {
      params: inventoryIdSchema,
      body: reserveStockSchema,
    },
    preHandler: [requireUser()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { quantity, orderId } = request.body as any;
      
      logger.info('Releasing inventory stock via API:', { 
        id, 
        quantity,
        orderId,
        userId: (request.user as AuthenticatedUser)?.id 
      });

      await inventoryService.releaseStock(id, quantity, orderId);

      reply.status(200).send({
        success: true,
        message: 'Stock released successfully',
        data: { inventoryId: id, quantity, orderId },
      });
    } catch (error) {
      logger.error('Error releasing inventory stock via API:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'Inventory item not found',
          error: 'INVENTORY_NOT_FOUND',
        });
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to release stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/inventory/alerts/low-stock - Get low stock alerts
  fastify.get('/alerts/low-stock', {
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Getting low stock alerts via API:', { 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const lowStockItems = await inventoryService.getLowStockAlerts();

      reply.status(200).send({
        success: true,
        data: {
          items: lowStockItems.map(item => item.toJSON()),
          count: lowStockItems.length,
        },
      });
    } catch (error) {
      logger.error('Error getting low stock alerts via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to get low stock alerts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /api/inventory/stats/overview - Get inventory statistics
  fastify.get('/stats/overview', {
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Getting inventory statistics via API:', { 
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const stats = await inventoryService.getInventoryStats();

      reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting inventory statistics via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to get inventory statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // POST /api/inventory/bulk-sync - Bulk sync inventory items
  fastify.post('/bulk-sync', {
    schema: {
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: createInventorySchema,
          },
          createMissing: { type: 'boolean', default: true },
          updateExisting: { type: 'boolean', default: true },
        },
      },
    },
    preHandler: [requireAdmin()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { items, createMissing, updateExisting } = request.body as any;
      
      logger.info('Bulk syncing inventory via API:', { 
        itemCount: items.length,
        createMissing,
        updateExisting,
        userId: (request.user as AuthenticatedUser)?.id 
      });

      const results = {
        created: 0,
        updated: 0,
        errors: [] as string[],
      };

      for (const item of items) {
        try {
          // Check if inventory exists
          const existing = await inventoryService.getInventoryBySku(item.sku || '', item.location);
          
          if (existing.length > 0 && updateExisting) {
            // Update existing inventory
            await inventoryService.updateInventory(existing[0].id, {
              stock: item.stock,
              threshold: item.threshold,
              metadata: item.metadata,
            });
            results.updated++;
          } else if (createMissing) {
            // Create new inventory
            await inventoryService.createInventory(item);
            results.created++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Item ${item.sku || 'unknown'}: ${errorMessage}`);
        }
      }

      reply.status(200).send({
        success: true,
        message: 'Bulk sync completed',
        data: results,
      });
    } catch (error) {
      logger.error('Error bulk syncing inventory via API:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to bulk sync inventory',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
} 
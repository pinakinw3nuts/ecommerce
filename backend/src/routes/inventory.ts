import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { InventoryService } from '../services/inventory.service';
import { MovementType } from '../entities/InventoryMovement';
import { requireUser, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

// Zod schemas for validation
const createInventorySchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  sku: z.string().max(20).optional(),
  stock: z.number().int().min(0),
  location: z.string().min(1).max(100),
  threshold: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateInventorySchema = z.object({
  stock: z.number().int().min(0).optional(),
  threshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const adjustStockSchema = z.object({
  quantity: z.number().int(),
  type: z.nativeEnum(MovementType),
  reason: z.string().min(1).max(255),
  metadata: z.record(z.any()).optional(),
});

const listInventorySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  sku: z.string().optional(),
  location: z.string().optional(),
  isLowStock: z.string().transform(val => val === 'true').optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

const inventoryIdSchema = z.object({
  id: z.string().uuid(),
});

const skuSchema = z.object({
  sku: z.string().min(1).max(20),
});

const reserveStockSchema = z.object({
  quantity: z.number().int().min(1),
  orderId: z.string().uuid().optional(),
});

interface CreateInventoryRequest {
  Body: z.infer<typeof createInventorySchema>;
}

interface UpdateInventoryRequest {
  Params: z.infer<typeof inventoryIdSchema>;
  Body: z.infer<typeof updateInventorySchema>;
}

interface AdjustStockRequest {
  Params: z.infer<typeof inventoryIdSchema>;
  Body: z.infer<typeof adjustStockSchema>;
}

interface ListInventoryRequest {
  Querystring: z.infer<typeof listInventorySchema>;
}

interface InventoryIdRequest {
  Params: z.infer<typeof inventoryIdSchema>;
}

interface SkuRequest {
  Params: z.infer<typeof skuSchema>;
  Querystring: {
    location?: string;
  };
}

interface ReserveStockRequest {
  Params: z.infer<typeof inventoryIdSchema>;
  Body: z.infer<typeof reserveStockSchema>;
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
      querystring: z.object({
        location: z.string().optional(),
      }),
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
      body: z.object({
        items: z.array(createInventorySchema),
        createMissing: z.boolean().default(true),
        updateExisting: z.boolean().default(true),
      }),
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
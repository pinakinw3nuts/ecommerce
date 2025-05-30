import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import { InventoryController } from '../controllers/inventory.controller';

// Initialize services and controller
const inventoryController = new InventoryController();

// Validation schemas
const inventoryParamsSchema = z.object({
  sku: z.string().min(1).max(20)
});

const inventoryQuerySchema = z.object({
  location: z.string().optional()
});

const createInventorySchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  sku: z.string().max(20).optional(),
  stock: z.number().int().min(0),
  location: z.string().min(1).max(100),
  threshold: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional()
});

const updateInventorySchema = z.object({
  stock: z.number().int().min(0).optional(),
  threshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
});

const bulkSyncSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    sku: z.string().max(20).optional(),
    stock: z.number().int().min(0),
    location: z.string().min(1).max(100),
    threshold: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).optional()
  })),
  createMissing: z.boolean().default(true),
  updateExisting: z.boolean().default(true)
});

export async function registerInventoryRoutes(fastify: FastifyInstance): Promise<void> {
  // Register inventory routes with prefix
  await fastify.register(async (instance: FastifyInstance) => {
    // Check if we're in a protected context (has auth decorator)
    const isProtected = instance.hasDecorator('auth');
    
    // GET /inventory/:sku - Get inventory by SKU
    instance.get('/:sku',
      {
        schema: {
          tags: ['inventory'],
          summary: 'Get inventory by SKU',
          params: {
            type: 'object',
            required: ['sku'],
            properties: {
              sku: { type: 'string' }
            }
          },
          querystring: {
            type: 'object',
            properties: {
              location: { type: 'string' }
            }
          },
          response: {
            200: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  variantId: { type: 'string', nullable: true },
                  sku: { type: 'string' },
                  stock: { type: 'integer' },
                  location: { type: 'string' },
                  threshold: { type: 'integer' },
                  isLowStock: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  metadata: { type: 'object', additionalProperties: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        preHandler: [
          validateParams(inventoryParamsSchema),
          validateQuery(inventoryQuerySchema)
        ]
      },
      (request: FastifyRequest, reply: FastifyReply) => inventoryController.getInventoryBySku(request, reply)
    );

    // Protected routes (require authentication)
    if (isProtected) {
      // Add auth guard to all routes in this group
      instance.addHook('preHandler', authGuard);
      
      // POST /inventory - Create new inventory item
      instance.post('/',
        {
          schema: {
            tags: ['inventory'],
            summary: 'Create new inventory item',
            body: {
              type: 'object',
              required: ['productId', 'stock', 'location'],
              properties: {
                productId: { type: 'string', format: 'uuid' },
                variantId: { type: 'string', format: 'uuid' },
                sku: { type: 'string', maxLength: 20 },
                stock: { type: 'integer', minimum: 0 },
                location: { type: 'string', maxLength: 100 },
                threshold: { type: 'integer', minimum: 0 },
                metadata: { type: 'object', additionalProperties: true }
              }
            },
            response: {
              201: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  variantId: { type: 'string', nullable: true },
                  sku: { type: 'string' },
                  stock: { type: 'integer' },
                  location: { type: 'string' },
                  threshold: { type: 'integer' },
                  isLowStock: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  metadata: { type: 'object', additionalProperties: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          },
          preHandler: [validateBody(createInventorySchema)]
        },
        (request: FastifyRequest, reply: FastifyReply) => inventoryController.createInventory(request, reply)
      );

      // PUT /inventory/:sku - Update inventory by SKU
      instance.put('/:sku',
        {
          schema: {
            tags: ['inventory'],
            summary: 'Update inventory by SKU',
            params: {
              type: 'object',
              required: ['sku'],
              properties: {
                sku: { type: 'string' }
              }
            },
            querystring: {
              type: 'object',
              properties: {
                location: { type: 'string' }
              }
            },
            body: {
              type: 'object',
              properties: {
                stock: { type: 'integer', minimum: 0 },
                threshold: { type: 'integer', minimum: 0 },
                isActive: { type: 'boolean' },
                metadata: { type: 'object', additionalProperties: true }
              }
            },
            response: {
              200: {
                type: 'object',
                properties: {
                  updated: { type: 'integer' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        sku: { type: 'string' },
                        location: { type: 'string' },
                        stock: { type: 'integer' },
                        isLowStock: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          },
          preHandler: [
            validateParams(inventoryParamsSchema),
            validateQuery(inventoryQuerySchema),
            validateBody(updateInventorySchema)
          ]
        },
        (request: FastifyRequest, reply: FastifyReply) => inventoryController.updateInventory(request, reply)
      );

      // POST /inventory/bulk-sync - Bulk sync inventory
      instance.post('/bulk-sync',
        {
          schema: {
            tags: ['inventory'],
            summary: 'Bulk sync inventory items',
            body: {
              type: 'object',
              required: ['items'],
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['productId', 'stock', 'location'],
                    properties: {
                      productId: { type: 'string', format: 'uuid' },
                      variantId: { type: 'string', format: 'uuid' },
                      sku: { type: 'string', maxLength: 20 },
                      stock: { type: 'integer', minimum: 0 },
                      location: { type: 'string', maxLength: 100 },
                      threshold: { type: 'integer', minimum: 0 },
                      metadata: { type: 'object', additionalProperties: true }
                    }
                  }
                },
                createMissing: { type: 'boolean', default: true },
                updateExisting: { type: 'boolean', default: true }
              }
            },
            response: {
              200: {
                type: 'object',
                properties: {
                  created: { type: 'integer' },
                  updated: { type: 'integer' },
                  failed: { type: 'integer' },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        index: { type: 'integer' },
                        sku: { type: 'string' },
                        location: { type: 'string' },
                        error: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          preHandler: [validateBody(bulkSyncSchema)]
        },
        (request: FastifyRequest, reply: FastifyReply) => inventoryController.bulkSyncInventory(request, reply)
      );
    }
  }, { prefix: '/inventory' });
} 
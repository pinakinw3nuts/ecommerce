import { FastifyInstance } from 'fastify';
import { AlertController } from '../controllers/alert.controller';
import { authGuard } from '../middlewares/authGuard';
import { roleGuard } from '../middlewares/roleGuard';

// Initialize controller
const alertController = new AlertController();

export async function registerAlertRoutes(fastify: FastifyInstance): Promise<void> {
  // Register alert routes with prefix
  await fastify.register(async (instance: FastifyInstance) => {
    // All routes in this group require authentication
    instance.addHook('preHandler', authGuard);
    
    // GET /alerts/low-stock - Get low stock items (admin only)
    instance.get('/low-stock',
      {
        schema: {
          tags: ['alerts'],
          summary: 'Get low stock items',
          description: 'Returns a list of inventory items with stock below threshold. Admin role required.',
          response: {
            200: {
              type: 'object',
              properties: {
                count: { type: 'integer' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      productId: { type: 'string' },
                      variantId: { type: 'string', nullable: true },
                      sku: { type: 'string' },
                      stock: { type: 'integer' },
                      threshold: { type: 'integer' },
                      location: { type: 'string' },
                      metadata: { type: 'object', additionalProperties: true },
                      lastRestockedAt: { type: 'string', format: 'date-time', nullable: true },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            401: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' }
              }
            },
            403: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' }
              }
            }
          }
        },
        preHandler: [roleGuard('admin')]
      },
      alertController.getLowStockItems
    );
  }, { prefix: '/alerts' });
} 
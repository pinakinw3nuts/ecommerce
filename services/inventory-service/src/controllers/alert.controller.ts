import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AlertService, InventoryAlertItem as ServiceInventoryAlertItem } from '../services/alert.service';
import { validateQuery } from '../middlewares/validateRequest';
import { authGuard, AuthenticatedRequest } from '../middlewares/authGuard';
import { logger } from '../utils/logger';

// Initialize services
const alertService = new AlertService();

// Validation schemas
const alertQuerySchema = z.object({
  criticalOnly: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
  location: z.string().optional(),
  daysWithoutRestock: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined)
});

// Define types for alert items to match the service return type but with string dates
interface InventoryAlertItem {
  id: string;
  productId: string;
  variantId?: string | null;
  sku: string;
  stock: number;
  threshold: number;
  location: string;
  metadata?: Record<string, any>;
  lastRestockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to convert Date objects to ISO strings
function convertDatesToStrings(items: ServiceInventoryAlertItem[]): InventoryAlertItem[] {
  return items.map(item => ({
    ...item,
    lastRestockedAt: item.lastRestockedAt?.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  }));
}

/**
 * Register alert routes
 */
export async function alertRoutes(fastify: FastifyInstance) {
  // All alert routes require authentication
  fastify.addHook('preHandler', authGuard);

  // GET /alerts/low-stock - Get inventory items with low stock
  fastify.get('/low-stock',
    {
      schema: {
        tags: ['alerts'],
        summary: 'Get inventory items with low stock',
        description: 'Returns inventory items that are below their stock threshold. Requires admin role.',
        querystring: {
          type: 'object',
          properties: {
            criticalOnly: { type: 'boolean', description: 'If true, only returns items below 50% of threshold' },
            location: { type: 'string', description: 'Filter by location' },
            daysWithoutRestock: { type: 'integer', description: 'Filter for items not restocked in X days' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              lowStock: {
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
                    lastRestockedAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
              criticalLowStock: {
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
                    lastRestockedAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
              outOfStock: {
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
                    lastRestockedAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
              summary: {
                type: 'object',
                properties: {
                  totalLowStock: { type: 'integer' },
                  totalCriticalLowStock: { type: 'integer' },
                  totalOutOfStock: { type: 'integer' },
                  locationBreakdown: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        location: { type: 'string' },
                        lowStockCount: { type: 'integer' },
                        criticalCount: { type: 'integer' },
                        outOfStockCount: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' }
            }
          }
        },
        security: [
          { apiKey: [] }
        ]
      },
      preHandler: [validateQuery(alertQuerySchema)]
    },
    async function getLowStockItems(request: FastifyRequest, reply: FastifyReply) {
      try {
        // Cast request to authenticated request
        const authRequest = request as AuthenticatedRequest;
        
        // Check if user has admin role or inventory:admin permission
        const hasAdminAccess = 
          authRequest.user.role === 'ADMIN' || 
          (authRequest.user.permissions && 
            (authRequest.user.permissions.includes('inventory:admin') || 
             authRequest.user.permissions.includes('alerts:read')));
        
        if (!hasAdminAccess) {
          logger.warn({
            userId: authRequest.user.id,
            role: authRequest.user.role,
            permissions: authRequest.user.permissions
          }, 'Unauthorized access attempt to low stock alerts');
          
          return reply.code(403).send({
            message: 'Insufficient permissions to access alerts',
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
        
        // Extract query parameters
        const criticalOnly = request.query ? (request.query as any).criticalOnly : undefined;
        const location = request.query ? (request.query as any).location : undefined;
        const daysWithoutRestock = request.query ? (request.query as any).daysWithoutRestock : undefined;
        
        logger.info({
          userId: authRequest.user.id,
          criticalOnly,
          location,
          daysWithoutRestock
        }, 'Getting low stock alerts');
        
        // Get alerts data
        let lowStock: InventoryAlertItem[] = [];
        let criticalLowStock: InventoryAlertItem[] = [];
        let outOfStock: InventoryAlertItem[] = [];
        let notRestockedItems: InventoryAlertItem[] = [];
        
        if (daysWithoutRestock) {
          const items = await alertService.getItemsNotRestockedInDays(daysWithoutRestock);
          notRestockedItems = convertDatesToStrings(items);
        }
        
        // If criticalOnly is true, only get critical items
        if (criticalOnly) {
          const criticalItems = await alertService.getCriticalLowStockItems();
          criticalLowStock = convertDatesToStrings(criticalItems);
          
          const outOfStockItems = await alertService.getOutOfStockItems();
          outOfStock = convertDatesToStrings(outOfStockItems);
        } else {
          // Get all alert categories
          const alertData = await alertService.checkThresholdBreaches();
          lowStock = convertDatesToStrings(alertData.lowStock);
          criticalLowStock = convertDatesToStrings(alertData.criticalLowStock);
          outOfStock = convertDatesToStrings(alertData.outOfStock);
        }
        
        // Filter by location if specified
        if (location) {
          lowStock = lowStock.filter(item => item.location === location);
          criticalLowStock = criticalLowStock.filter(item => item.location === location);
          outOfStock = outOfStock.filter(item => item.location === location);
          notRestockedItems = notRestockedItems.filter(item => item.location === location);
        }
        
        // Create location breakdown
        const locationMap = new Map<string, { 
          location: string; 
          lowStockCount: number; 
          criticalCount: number;
          outOfStockCount: number;
        }>();
        
        // Process all items to build location breakdown
        [...lowStock, ...criticalLowStock, ...outOfStock].forEach(item => {
          if (!locationMap.has(item.location)) {
            locationMap.set(item.location, {
              location: item.location,
              lowStockCount: 0,
              criticalCount: 0,
              outOfStockCount: 0
            });
          }
          
          const locationStats = locationMap.get(item.location)!;
          
          if (item.stock === 0) {
            locationStats.outOfStockCount++;
          } else if (item.stock <= item.threshold * 0.5) {
            locationStats.criticalCount++;
          } else if (item.stock <= item.threshold) {
            locationStats.lowStockCount++;
          }
        });
        
        // Create summary
        const summary = {
          totalLowStock: lowStock.length,
          totalCriticalLowStock: criticalLowStock.length,
          totalOutOfStock: outOfStock.length,
          locationBreakdown: Array.from(locationMap.values())
        };
        
        return reply.code(200).send({
          lowStock,
          criticalLowStock,
          outOfStock,
          ...(daysWithoutRestock ? { notRestockedItems } : {}),
          summary
        });
      } catch (error) {
        logger.error({ error }, 'Error getting low stock alerts');
        
        return reply.code(500).send({
          message: 'Error retrieving low stock alerts',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
}

// Controller class for alert endpoints
export class AlertController {
  private alertService: AlertService;
  
  constructor() {
    this.alertService = new AlertService();
  }
  
  // Method to get low stock items
  async getLowStockItems(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authRequest = request as AuthenticatedRequest;
      
      logger.info({ 
        userId: authRequest.user?.id,
        role: authRequest.user?.role
      }, 'Getting low stock items');
      
      const lowStockItems = await this.alertService.getLowStockItems();
      
      return reply.code(200).send({
        count: lowStockItems.length,
        items: lowStockItems
      });
    } catch (error) {
      logger.error({ error }, 'Error getting low stock items');
      return reply.code(500).send({ 
        message: 'Error retrieving low stock items',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
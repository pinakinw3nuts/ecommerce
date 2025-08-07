import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PricingService, PriceCalculationOptions } from '../services/pricing.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const pricingService = new PricingService();
const pricingLogger = logger.child({ service: 'PricingRoutes' });

// Zod schemas for request validation
const PriceCalculationQuerySchema = z.object({
  currency: z.string().optional(),
  customerGroupIds: z.string().optional().transform(val => val ? val.split(',') : []),
  formatPrice: z.string().optional().transform(val => val === 'true'),
  locale: z.string().optional(),
  decimals: z.string().optional().transform(val => val ? parseInt(val) : 2),
  quantity: z.string().optional().transform(val => val ? parseInt(val) : 1)
});

const BulkPriceCalculationSchema = z.object({
  productIds: z.array(z.string()),
  quantity: z.number().optional().default(1),
  options: z.object({
    currency: z.string().optional(),
    customerGroupIds: z.array(z.string()).optional(),
    formatPrice: z.boolean().optional(),
    locale: z.string().optional(),
    decimals: z.number().optional()
  }).optional()
});

const CurrencyUpdateSchema = z.object({
  rate: z.number().positive()
});

export async function pricingRoutes(fastify: FastifyInstance) {
  // Public routes (no authentication required)
  
  // Get price for a single product
  fastify.get('/products/:id', {
    schema: {
      tags: ['pricing'],
      summary: 'Get product price',
      params: z.object({
        id: z.string().uuid()
      }),
      querystring: PriceCalculationQuerySchema,
      response: {
        200: z.object({
          price: z.union([z.number(), z.string()]),
          originalPrice: z.number(),
          currency: z.string(),
          onSale: z.boolean(),
          priceListId: z.string().optional(),
          customerGroupId: z.string().optional(),
          appliedTier: z.object({
            quantity: z.number(),
            price: z.number(),
            discount: z.number().optional()
          }).optional(),
          discountPercentage: z.number().optional()
        })
      }
    }
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Querystring: PriceCalculationOptions;
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const options = request.query;
      
      // If authenticated, include customer groups from user
      if ((request as any).user) {
        // In a real implementation, you would get customer groups from user
        // For now, we'll use the ones from query params
      }
      
      const price = await pricingService.calculatePrice(id, options.quantity || 1, options);
      
      return reply.send(price);
    } catch (error) {
      pricingLogger.error({ error, params: request.params }, 'Error getting product price');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get product price'
      });
    }
  });

  // Get prices for multiple products
  fastify.post('/products/bulk', {
    schema: {
      tags: ['pricing'],
      summary: 'Get prices for multiple products',
      body: BulkPriceCalculationSchema,
      response: {
        200: z.record(z.string(), z.object({
          price: z.union([z.number(), z.string()]),
          originalPrice: z.number(),
          currency: z.string(),
          onSale: z.boolean(),
          priceListId: z.string().optional(),
          customerGroupId: z.string().optional(),
          appliedTier: z.object({
            quantity: z.number(),
            price: z.number(),
            discount: z.number().optional()
          }).optional(),
          discountPercentage: z.number().optional()
        }))
      }
    }
  }, async (request: FastifyRequest<{
    Body: {
      productIds: string[];
      quantity?: number;
      options?: PriceCalculationOptions;
    };
  }>, reply: FastifyReply) => {
    try {
      const { productIds, quantity = 1, options = {} } = request.body;
      
      // If authenticated, include customer groups from user
      if ((request as any).user) {
        // In a real implementation, you would get customer groups from user
      }
      
      const prices = await pricingService.calculatePrices(productIds, quantity, options);
      
      return reply.send(prices);
    } catch (error) {
      pricingLogger.error({ error, body: request.body }, 'Error getting bulk product prices');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get product prices'
      });
    }
  });

  // Get active currencies
  fastify.get('/currencies', {
    schema: {
      tags: ['pricing'],
      summary: 'Get active currencies',
      response: {
        200: z.array(z.object({
          code: z.string(),
          name: z.string(),
          symbol: z.string().nullable(),
          exchangeRate: z.number(),
          isDefault: z.boolean(),
          isActive: z.boolean(),
          decimalPlaces: z.number(),
          format: z.string().nullable(),
          rateLastUpdated: z.date().nullable(),
          createdAt: z.date(),
          updatedAt: z.date()
        }))
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const currencies = await pricingService.getActiveCurrencies();
      return reply.send(currencies);
    } catch (error) {
      pricingLogger.error({ error }, 'Error getting currencies');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get currencies'
      });
    }
  });

  // Get currency by code
  fastify.get('/currencies/:code', {
    schema: {
      tags: ['pricing'],
      summary: 'Get currency by code',
      params: z.object({
        code: z.string()
      }),
      response: {
        200: z.object({
          code: z.string(),
          name: z.string(),
          symbol: z.string().nullable(),
          exchangeRate: z.number(),
          isDefault: z.boolean(),
          isActive: z.boolean(),
          decimalPlaces: z.number(),
          format: z.string().nullable(),
          rateLastUpdated: z.date().nullable(),
          createdAt: z.date(),
          updatedAt: z.date()
        }).nullable()
      }
    }
  }, async (request: FastifyRequest<{
    Params: { code: string };
  }>, reply: FastifyReply) => {
    try {
      const { code } = request.params;
      const currency = await pricingService.getCurrencyByCode(code);
      
      if (!currency) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Currency ${code} not found`
        });
      }
      
      return reply.send(currency);
    } catch (error) {
      pricingLogger.error({ error, params: request.params }, 'Error getting currency');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get currency'
      });
    }
  });

  // Protected routes (require authentication)
  
  // Update currency exchange rate (admin only)
  fastify.put('/currencies/:code/rate', {
    preHandler: requireAdmin,
    schema: {
      tags: ['pricing', 'admin'],
      summary: 'Update currency exchange rate',
      params: z.object({
        code: z.string()
      }),
      body: CurrencyUpdateSchema,
      response: {
        200: z.object({
          code: z.string(),
          name: z.string(),
          symbol: z.string().nullable(),
          exchangeRate: z.number(),
          isDefault: z.boolean(),
          isActive: z.boolean(),
          decimalPlaces: z.number(),
          format: z.string().nullable(),
          rateLastUpdated: z.date().nullable(),
          createdAt: z.date(),
          updatedAt: z.date()
        })
      }
    }
  }, async (request: FastifyRequest<{
    Params: { code: string };
    Body: { rate: number };
  }>, reply: FastifyReply) => {
    try {
      const { code } = request.params;
      const { rate } = request.body;
      
      const currency = await pricingService.updateCurrencyRate(code, rate);
      
      return reply.send(currency);
    } catch (error) {
      pricingLogger.error({ error, params: request.params, body: request.body }, 'Error updating currency rate');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to update currency rate'
      });
    }
  });

  // Get exchange rates metadata
  fastify.get('/rates/metadata', {
    schema: {
      tags: ['pricing'],
      summary: 'Get exchange rates metadata',
      response: {
        200: z.object({
          lastUpdated: z.string(),
          source: z.string(),
          nextUpdate: z.string().optional()
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { rateFetcher } = await import('../utils/rateFetcher');
      const metadata = await rateFetcher.getMetadata();
      return reply.send(metadata);
    } catch (error) {
      pricingLogger.error({ error }, 'Error getting rates metadata');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get rates metadata'
      });
    }
  });

  // Force refresh exchange rates (admin only)
  fastify.post('/rates/refresh', {
    preHandler: requireAdmin,
    schema: {
      tags: ['pricing', 'admin'],
      summary: 'Force refresh exchange rates',
      response: {
        200: z.object({
          updated: z.boolean(),
          rates: z.record(z.string(), z.number()),
          timestamp: z.string(),
          source: z.string()
        })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { rateFetcher } = await import('../utils/rateFetcher');
      const result = await rateFetcher.fetchRates({ force: true });
      return reply.send(result);
    } catch (error) {
      pricingLogger.error({ error }, 'Error refreshing rates');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to refresh rates'
      });
    }
  });
} 
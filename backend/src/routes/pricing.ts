import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PricingService, PriceCalculationOptions } from '../services/pricing.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const pricingService = new PricingService();
const pricingLogger = logger.child({ service: 'PricingRoutes' });

// JSON schemas for request validation
const PriceCalculationQuerySchema = {
  type: 'object',
  properties: {
    currency: { type: 'string' },
    customerGroupIds: { type: 'string' },
    formatPrice: { type: 'string' },
    locale: { type: 'string' },
    decimals: { type: 'string' },
    quantity: { type: 'string' }
  }
};

const BulkPriceCalculationSchema = {
  type: 'object',
  required: ['productIds'],
  properties: {
    productIds: { type: 'array', items: { type: 'string' } },
    quantity: { type: 'number', default: 1 },
    options: {
      type: 'object',
      properties: {
        currency: { type: 'string' },
        customerGroupIds: { type: 'array', items: { type: 'string' } },
        formatPrice: { type: 'boolean' },
        locale: { type: 'string' },
        decimals: { type: 'number' }
      }
    }
  }
};

const CurrencyUpdateSchema = {
  type: 'object',
  required: ['rate'],
  properties: {
    rate: { type: 'number', minimum: 0.01 }
  }
};

export async function pricingRoutes(fastify: FastifyInstance) {
  // Public routes (no authentication required)
  
  // Get price for a single product
  fastify.get('/products/:id', {
    schema: {
      tags: ['pricing'],
      summary: 'Get product price',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      querystring: PriceCalculationQuerySchema,
      response: {
        200: {
          type: 'object',
          required: ['price', 'originalPrice', 'currency', 'onSale', 'priceListId', 'customerGroupId', 'appliedTier', 'discountPercentage'],
          properties: {
            price: { type: ['number', 'string'] },
            originalPrice: { type: 'number' },
            currency: { type: 'string' },
            onSale: { type: 'boolean' },
            priceListId: { type: 'string', nullable: true },
            customerGroupId: { type: 'string', nullable: true },
            appliedTier: {
              type: 'object',
              properties: {
                quantity: { type: 'number' },
                price: { type: 'number' },
                discount: { type: 'number', nullable: true }
              },
              nullable: true
            },
            discountPercentage: { type: 'number', nullable: true }
          }
        }
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
        200: {
          type: 'object',
          patternProperties: {
            '^.*$': {
              type: 'object',
              required: ['price', 'originalPrice', 'currency', 'onSale', 'priceListId', 'customerGroupId', 'appliedTier', 'discountPercentage'],
              properties: {
                price: { type: ['number', 'string'] },
                originalPrice: { type: 'number' },
                currency: { type: 'string' },
                onSale: { type: 'boolean' },
                priceListId: { type: 'string', nullable: true },
                customerGroupId: { type: 'string', nullable: true },
                appliedTier: {
                  type: 'object',
                  properties: {
                    quantity: { type: 'number' },
                    price: { type: 'number' },
                    discount: { type: 'number', nullable: true }
                  },
                  nullable: true
                },
                discountPercentage: { type: 'number', nullable: true }
              }
            }
          }
        }
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
        200: {
          type: 'array',
          items: {
            type: 'object',
            required: ['code', 'name', 'symbol', 'exchangeRate', 'isDefault', 'isActive', 'decimalPlaces', 'format', 'rateLastUpdated', 'createdAt', 'updatedAt'],
            properties: {
              code: { type: 'string' },
              name: { type: 'string' },
              symbol: { type: 'string', nullable: true },
              exchangeRate: { type: 'number' },
              isDefault: { type: 'boolean' },
              isActive: { type: 'boolean' },
              decimalPlaces: { type: 'number' },
              format: { type: 'string', nullable: true },
              rateLastUpdated: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
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
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          required: ['code', 'name', 'symbol', 'exchangeRate', 'isDefault', 'isActive', 'decimalPlaces', 'format', 'rateLastUpdated', 'createdAt', 'updatedAt'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            symbol: { type: 'string', nullable: true },
            exchangeRate: { type: 'number' },
            isDefault: { type: 'boolean' },
            isActive: { type: 'boolean' },
            decimalPlaces: { type: 'number' },
            format: { type: 'string', nullable: true },
            rateLastUpdated: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          nullable: true
        }
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
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      body: CurrencyUpdateSchema,
      response: {
        200: {
          type: 'object',
          required: ['code', 'name', 'symbol', 'exchangeRate', 'isDefault', 'isActive', 'decimalPlaces', 'format', 'rateLastUpdated', 'createdAt', 'updatedAt'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            symbol: { type: 'string', nullable: true },
            exchangeRate: { type: 'number' },
            isDefault: { type: 'boolean' },
            isActive: { type: 'boolean' },
            decimalPlaces: { type: 'number' },
            format: { type: 'string', nullable: true },
            rateLastUpdated: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
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
        200: {
          type: 'object',
          required: ['lastUpdated', 'source', 'nextUpdate'],
          properties: {
            lastUpdated: { type: 'string' },
            source: { type: 'string' },
            nextUpdate: { type: 'string', nullable: true }
          }
        }
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
        200: {
          type: 'object',
          required: ['updated', 'rates', 'timestamp', 'source'],
          properties: {
            updated: { type: 'boolean' },
            rates: {
              type: 'object',
              patternProperties: {
                '^.*$': { type: 'number' }
              }
            },
            timestamp: { type: 'string' },
            source: { type: 'string' }
          }
        }
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
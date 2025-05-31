import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rateFetcher } from '../utils/rateFetcher';
import { rateService } from '../services/rate.service';
import { createLogger } from '../utils/logger';
import { requireRoles } from '../middlewares/authGuard';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import { env } from '../config/env';
import { convert } from '../utils/currency';

const logger = createLogger('rate-controller');

// Schema for rate update request
const rateUpdateSchema = z.object({
  force: z.boolean().optional().default(false),
  source: z.string().optional()
});

// Schema for manual rate update
const manualRateSchema = z.object({
  baseCurrency: z.string().length(3),
  targetCurrency: z.string().length(3),
  rate: z.number().positive(),
  source: z.string().optional().default('manual')
});

// Define request schemas
const convertAmountSchema = z.object({
  amount: z.coerce.number().positive(),
  from: z.string().length(3),
  to: z.string().length(3),
  format: z.coerce.boolean().default(false)
});

const setRateSchema = z.object({
  baseCurrency: z.string().length(3),
  targetCurrency: z.string().length(3),
  rate: z.coerce.number().positive(),
  source: z.string().optional()
});

/**
 * Controller for currency rate-related endpoints
 * All routes require admin authentication
 */
export class RateController {
  /**
   * Register admin routes (admin authentication required)
   */
  async registerAdminRoutes(fastify: FastifyInstance): Promise<void> {
    // Get all current rates
    fastify.get('/rates', {
      schema: {
        tags: ['rates'],
        summary: 'Get all current exchange rates',
        description: 'Returns all cached exchange rates (admin only)',
        response: {
          200: {
            type: 'object',
            properties: {
              baseCurrency: { type: 'string', description: 'Base currency code' },
              rates: { 
                type: 'object',
                additionalProperties: { type: 'number' },
                description: 'Map of currency codes to exchange rates'
              },
              lastUpdated: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
              source: { type: 'string', description: 'Source of the rate data' }
            }
          },
          401: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: requireRoles(['admin']),
      handler: async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
          logger.debug('Getting all exchange rates');
          
          const rates = await rateFetcher.getRates();
          const metadata = await rateFetcher.getMetadata();
          
          return reply.send({
            baseCurrency: env.DEFAULT_CURRENCY,
            rates,
            lastUpdated: metadata.lastUpdated,
            source: metadata.source
          });
        } catch (error) {
          logger.error({ error }, 'Error getting exchange rates');
          
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An error occurred while retrieving exchange rates'
          });
        }
      }
    });
    
    // Trigger rate update
    fastify.post('/rates/update', {
      schema: {
        tags: ['rates'],
        summary: 'Trigger exchange rate update',
        description: 'Triggers an update of exchange rates from the configured source (admin only)',
        body: {
          type: 'object',
          properties: {
            force: { type: 'boolean', description: 'Force update even if cache is still valid' },
            source: { type: 'string', description: 'Optional source override' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', description: 'Whether the update was successful' },
              message: { type: 'string', description: 'Status message' },
              updated: { type: 'boolean', description: 'Whether rates were actually updated' },
              baseCurrency: { type: 'string', description: 'Base currency code' },
              rateCount: { type: 'number', description: 'Number of rates updated' },
              lastUpdated: { type: 'string', format: 'date-time', description: 'Update timestamp' },
              source: { type: 'string', description: 'Source of the rate data' }
            }
          },
          401: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: [
        requireRoles(['admin']),
        validateRequest(rateUpdateSchema, 'body')
      ],
      handler: async (request: FastifyRequest<{
        Body: z.infer<typeof rateUpdateSchema>
      }>, reply: FastifyReply) => {
        try {
          const { force, source } = request.body;
          
          logger.debug({ force, source }, 'Triggering exchange rate update');
          
          const result = await rateFetcher.fetchRates({ force, source });
          
          if (result.updated) {
            // If rates were updated, persist them to the database
            await rateService.syncRates(result.rates, {
              source: result.source
            });
          }
          
          return reply.send({
            success: true,
            message: result.updated 
              ? 'Exchange rates updated successfully' 
              : 'Exchange rates are already up to date',
            updated: result.updated,
            baseCurrency: env.DEFAULT_CURRENCY,
            rateCount: Object.keys(result.rates).length,
            lastUpdated: result.timestamp,
            source: result.source
          });
        } catch (error) {
          logger.error({ error, body: request.body }, 'Error updating exchange rates');
          
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An error occurred while updating exchange rates'
          });
        }
      }
    });
    
    // Set a specific exchange rate manually
    fastify.post('/rates/manual', {
      schema: {
        tags: ['rates'],
        summary: 'Set exchange rate manually',
        description: 'Manually set an exchange rate between two currencies (admin only)',
        body: {
          type: 'object',
          required: ['baseCurrency', 'targetCurrency', 'rate'],
          properties: {
            baseCurrency: { type: 'string', minLength: 3, maxLength: 3, description: 'Base currency code (ISO)' },
            targetCurrency: { type: 'string', minLength: 3, maxLength: 3, description: 'Target currency code (ISO)' },
            rate: { type: 'number', minimum: 0, exclusiveMinimum: true, description: 'Exchange rate' },
            source: { type: 'string', description: 'Source of the rate (defaults to "manual")' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', description: 'Whether the update was successful' },
              baseCurrency: { type: 'string', description: 'Base currency code' },
              targetCurrency: { type: 'string', description: 'Target currency code' },
              rate: { type: 'number', description: 'Exchange rate' },
              timestamp: { type: 'string', format: 'date-time', description: 'Update timestamp' },
              source: { type: 'string', description: 'Source of the rate' }
            }
          },
          400: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: [
        requireRoles(['admin']),
        validateRequest(manualRateSchema, 'body')
      ],
      handler: async (request: FastifyRequest<{
        Body: z.infer<typeof manualRateSchema>
      }>, reply: FastifyReply) => {
        try {
          const { baseCurrency, targetCurrency, rate, source } = request.body;
          
          if (baseCurrency === targetCurrency) {
            return reply.code(400).send({
              statusCode: 400,
              error: 'Bad Request',
              message: 'Base currency and target currency must be different'
            });
          }
          
          logger.debug({ baseCurrency, targetCurrency, rate, source }, 'Setting manual exchange rate');
          
          // Store the rate in the database
          const timestamp = new Date();
          await rateService.setRate(baseCurrency, targetCurrency, rate, {
            source,
            timestamp
          });
          
          // Update the in-memory cache
          await rateFetcher.setRate(baseCurrency, targetCurrency, rate);
          
          return reply.send({
            success: true,
            baseCurrency,
            targetCurrency,
            rate,
            timestamp: timestamp.toISOString(),
            source
          });
        } catch (error) {
          logger.error({ error, body: request.body }, 'Error setting manual exchange rate');
          
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An error occurred while setting the exchange rate'
          });
        }
      }
    });
    
    // Delete a specific exchange rate
    fastify.delete('/rates/:baseCurrency/:targetCurrency', {
      schema: {
        tags: ['rates'],
        summary: 'Delete exchange rate',
        description: 'Delete a specific exchange rate (admin only)',
        params: {
          type: 'object',
          required: ['baseCurrency', 'targetCurrency'],
          properties: {
            baseCurrency: { type: 'string', minLength: 3, maxLength: 3, description: 'Base currency code (ISO)' },
            targetCurrency: { type: 'string', minLength: 3, maxLength: 3, description: 'Target currency code (ISO)' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', description: 'Whether the deletion was successful' },
              baseCurrency: { type: 'string', description: 'Base currency code' },
              targetCurrency: { type: 'string', description: 'Target currency code' }
            }
          },
          400: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: requireRoles(['admin']),
      handler: async (request: FastifyRequest<{
        Params: {
          baseCurrency: string;
          targetCurrency: string;
        }
      }>, reply: FastifyReply) => {
        try {
          const { baseCurrency, targetCurrency } = request.params;
          
          logger.debug({ baseCurrency, targetCurrency }, 'Deleting exchange rate');
          
          const deleted = await rateService.deleteRate(baseCurrency, targetCurrency);
          
          if (!deleted) {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Exchange rate not found'
            });
          }
          
          // Update the in-memory cache
          await rateFetcher.deleteRate(baseCurrency, targetCurrency);
          
          return reply.send({
            success: true,
            baseCurrency,
            targetCurrency
          });
        } catch (error) {
          logger.error({ error, params: request.params }, 'Error deleting exchange rate');
          
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An error occurred while deleting the exchange rate'
          });
        }
      }
    });
    
    // Get rate history
    fastify.get('/rates/history', {
      schema: {
        tags: ['rates'],
        summary: 'Get exchange rate history',
        description: 'Returns historical exchange rate data (admin only)',
        querystring: {
          type: 'object',
          properties: {
            baseCurrency: { type: 'string', minLength: 3, maxLength: 3, description: 'Base currency code (ISO)' },
            targetCurrency: { type: 'string', minLength: 3, maxLength: 3, description: 'Target currency code (ISO)' },
            startDate: { type: 'string', format: 'date', description: 'Start date (ISO format)' },
            endDate: { type: 'string', format: 'date', description: 'End date (ISO format)' },
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100, description: 'Maximum number of records' },
            offset: { type: 'integer', minimum: 0, default: 0, description: 'Offset for pagination' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              history: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    baseCurrency: { type: 'string', description: 'Base currency code' },
                    targetCurrency: { type: 'string', description: 'Target currency code' },
                    rate: { type: 'number', description: 'Exchange rate' },
                    timestamp: { type: 'string', format: 'date-time', description: 'Rate timestamp' },
                    source: { type: 'string', description: 'Source of the rate' }
                  }
                }
              },
              total: { type: 'number', description: 'Total number of records' },
              limit: { type: 'number', description: 'Limit used' },
              offset: { type: 'number', description: 'Offset used' }
            }
          },
          401: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: requireRoles(['admin']),
      handler: async (request: FastifyRequest<{
        Querystring: {
          baseCurrency?: string;
          targetCurrency?: string;
          startDate?: string;
          endDate?: string;
          limit?: number;
          offset?: number;
        }
      }>, reply: FastifyReply) => {
        try {
          const { baseCurrency, targetCurrency, startDate, endDate, limit = 100, offset = 0 } = request.query;
          
          logger.debug({ baseCurrency, targetCurrency, startDate, endDate, limit, offset }, 'Getting rate history');
          
          const { history, total } = await rateService.getRateHistory({
            baseCurrency,
            targetCurrency,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit,
            offset
          });
          
          return reply.send({
            history,
            total,
            limit,
            offset
          });
        } catch (error) {
          logger.error({ error, query: request.query }, 'Error getting rate history');
          
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An error occurred while retrieving rate history'
          });
        }
      }
    });
  }

  /**
   * Get current exchange rates
   */
  async getCurrentRates(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const rates = await rateFetcher.getRates();
      const metadata = await rateFetcher.getMetadata();
      
      return reply.send({
        rates,
        baseCurrency: env.DEFAULT_CURRENCY,
        lastUpdated: metadata.lastUpdated,
        source: metadata.source
      });
    } catch (error) {
      logger.error({ error }, 'Error getting current rates');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get current rates'
      });
    }
  }
  
  /**
   * Convert an amount between currencies
   */
  async convertAmount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { amount, from, to, format } = request.query as z.infer<typeof convertAmountSchema>;
      
      // Get current rates
      const rates = await rateFetcher.getRates();
      
      // Perform conversion
      const convertedAmount = convert(amount, from, to, rates, { format });
      
      // Calculate exchange rate
      const exchangeRate = convert(1, from, to, rates, { format: false }) as number;
      
      return reply.send({
        originalAmount: amount,
        convertedAmount,
        fromCurrency: from,
        toCurrency: to,
        exchangeRate,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error, query: request.query }, 'Error converting amount');
      
      if (error instanceof Error && error.message.includes('Currency rate not found')) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message
        });
      }
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to convert amount'
      });
    }
  }
  
  /**
   * Get all currency rates
   */
  async getAllRates(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const currencies = await rateService.getActiveCurrencies();
      
      // Format as a rate map
      const rateMap: Record<string, number> = {};
      currencies.forEach(currency => {
        if (currency.code !== env.DEFAULT_CURRENCY) {
          rateMap[currency.code] = currency.exchangeRate;
        }
      });
      
      return reply.send({
        baseCurrency: env.DEFAULT_CURRENCY,
        rates: rateMap,
        lastUpdated: rateService.getLastUpdateTime() || new Date()
      });
    } catch (error) {
      logger.error({ error }, 'Error getting all rates');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get all rates'
      });
    }
  }
  
  /**
   * Get a specific currency rate
   */
  async getRate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      
      if (!code || code.length !== 3) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid currency code'
        });
      }
      
      // Check if this is the default currency
      if (code.toUpperCase() === env.DEFAULT_CURRENCY) {
        return reply.send({
          baseCurrency: env.DEFAULT_CURRENCY,
          currency: code.toUpperCase(),
          rate: 1,
          lastUpdated: new Date()
        });
      }
      
      const currency = await rateService.getCurrencyByCode(code);
      
      if (!currency) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Currency ${code} not found`
        });
      }
      
      return reply.send({
        baseCurrency: env.DEFAULT_CURRENCY,
        currency: currency.code,
        rate: currency.exchangeRate,
        lastUpdated: currency.rateLastUpdated || rateService.getLastUpdateTime() || new Date()
      });
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error getting rate');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get rate'
      });
    }
  }
  
  /**
   * Get rate history
   */
  async getRateHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { 
        baseCurrency, 
        targetCurrency, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 20 
      } = request.query as any;
      
      const offset = (page - 1) * limit;
      
      const { history, total } = await rateService.getRateHistory({
        baseCurrency,
        targetCurrency,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit,
        offset
      });
      
      return reply.send({
        data: history,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error({ error, query: request.query }, 'Error getting rate history');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get rate history'
      });
    }
  }
  
  /**
   * Refresh rates from external source (admin only)
   */
  async refreshRates(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { force = false } = request.body as { force?: boolean };
      
      const result = await rateFetcher.fetchRates({ force });
      
      // Sync to database
      if (result.updated) {
        await rateService.syncRates(result.rates, { source: result.source });
      }
      
      return reply.send({
        updated: result.updated,
        timestamp: result.timestamp,
        source: result.source,
        rateCount: Object.keys(result.rates).length - 1 // Subtract 1 for base currency
      });
    } catch (error) {
      logger.error({ error }, 'Error refreshing rates');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to refresh rates'
      });
    }
  }
  
  /**
   * Set a specific exchange rate (admin only)
   */
  async setRate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { baseCurrency, targetCurrency, rate, source } = request.body as z.infer<typeof setRateSchema>;
      
      await rateService.setRate(baseCurrency, targetCurrency, rate, { source });
      
      // Also update in-memory cache
      await rateFetcher.setRate(baseCurrency, targetCurrency, rate);
      
      return reply.code(200).send({
        baseCurrency,
        targetCurrency,
        rate,
        timestamp: new Date().toISOString(),
        source: source || 'manual'
      });
    } catch (error) {
      logger.error({ error, body: request.body }, 'Error setting rate');
      
      if (error instanceof Error && 
          (error.message.includes('must be different') || 
           error.message.includes('must be positive'))) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message
        });
      }
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to set rate'
      });
    }
  }
  
  /**
   * Delete a specific exchange rate (admin only)
   */
  async deleteRate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { baseCurrency, targetCurrency } = request.params as { 
        baseCurrency: string; 
        targetCurrency: string;
      };
      
      const deleted = await rateService.deleteRate(baseCurrency, targetCurrency);
      
      if (!deleted) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Rate for ${baseCurrency}/${targetCurrency} not found`
        });
      }
      
      // Also update in-memory cache
      try {
        await rateFetcher.deleteRate(baseCurrency, targetCurrency);
      } catch (error) {
        logger.warn({ error }, 'Failed to delete rate from cache');
      }
      
      return reply.code(204).send();
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error deleting rate');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete rate'
      });
    }
  }
  
  /**
   * Get all currencies (admin only)
   */
  async getAllCurrencies(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const currencies = await rateService.getAllCurrencies();
      return reply.send(currencies);
    } catch (error) {
      logger.error({ error }, 'Error getting all currencies');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get all currencies'
      });
    }
  }
  
  /**
   * Create or update a currency (admin only)
   */
  async createOrUpdateCurrency(request: FastifyRequest, reply: FastifyReply) {
    try {
      const currencyData = request.body as any;
      
      const currency = await rateService.createOrUpdateCurrency(currencyData);
      
      return reply.code(200).send(currency);
    } catch (error) {
      logger.error({ error, body: request.body }, 'Error creating/updating currency');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create/update currency'
      });
    }
  }
  
  /**
   * Set default currency (admin only)
   */
  async setDefaultCurrency(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      
      const currency = await rateService.setDefaultCurrency(code);
      
      return reply.send(currency);
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error setting default currency');
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message
        });
      }
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to set default currency'
      });
    }
  }
  
  /**
   * Delete a currency (admin only)
   */
  async deleteCurrency(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      
      const deleted = await rateService.deleteCurrency(code);
      
      if (!deleted) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Currency with code ${code} not found`
        });
      }
      
      return reply.code(204).send();
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error deleting currency');
      
      if (error instanceof Error && error.message.includes('Cannot delete default currency')) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message
        });
      }
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete currency'
      });
    }
  }
}

// Export singleton instance
export const rateController = new RateController(); 
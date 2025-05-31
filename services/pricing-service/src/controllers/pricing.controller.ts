import { FastifyRequest, FastifyReply } from 'fastify';
import { pricingService } from '../services/pricing.service';
import { rateService } from '../services/rate.service';
import { createLogger } from '../utils/logger';
import { AuthenticatedRequest, getCustomerGroupIds } from '../middlewares/auth';

// Define price calculation options interface
export interface PriceCalculationOptions {
  currency?: string;
  quantity?: number;
  customerGroupIds?: string[];
  formatPrice?: boolean;
  locale?: string;
  decimals?: number;
}

const logger = createLogger('pricing-controller');

/**
 * Controller for pricing-related endpoints
 */
class PricingController {
  /**
   * Get price for a single product
   */
  async getProductPrice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const options = request.query as PriceCalculationOptions;
      
      // If authenticated, include customer groups
      if ((request as AuthenticatedRequest).user) {
        options.customerGroupIds = getCustomerGroupIds(request as AuthenticatedRequest);
      }
      
      const price = await pricingService.calculatePrice(id, options.quantity || 1, options);
      
      return reply.send(price);
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error getting product price');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get product price'
      });
    }
  }
  
  /**
   * Get prices for multiple products
   */
  async getProductsPrices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { ids } = request.query as { ids: string[] };
      const options = request.query as PriceCalculationOptions;
      
      // If authenticated, include customer groups
      if ((request as AuthenticatedRequest).user) {
        options.customerGroupIds = getCustomerGroupIds(request as AuthenticatedRequest);
      }
      
      const prices = await pricingService.calculatePrices(ids, options.quantity || 1, options);
      
      return reply.send(prices);
    } catch (error) {
      logger.error({ error, query: request.query }, 'Error getting product prices');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get product prices'
      });
    }
  }
  
  /**
   * Get active currencies
   */
  async getActiveCurrencies(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const currencies = await rateService.getActiveCurrencies();
      return reply.send(currencies);
    } catch (error) {
      logger.error({ error }, 'Error getting active currencies');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get active currencies'
      });
    }
  }
  
  /**
   * Get price lists for a customer
   */
  async getCustomerPriceLists(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const customerGroupIds = getCustomerGroupIds(request);
      
      const priceLists = await pricingService.getCustomerPriceLists(customerGroupIds);
      
      return reply.send(priceLists);
    } catch (error) {
      logger.error({ error, user: request.user }, 'Error getting customer price lists');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get customer price lists'
      });
    }
  }
  
  /**
   * Get all price lists (admin only)
   */
  async getAllPriceLists(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const priceLists = await pricingService.getAllPriceLists();
      return reply.send(priceLists);
    } catch (error) {
      logger.error({ error }, 'Error getting all price lists');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get all price lists'
      });
    }
  }
  
  /**
   * Get a specific price list (admin only)
   */
  async getPriceList(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const priceList = await pricingService.getPriceList(id);
      
      if (!priceList) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Price list with ID ${id} not found`
        });
      }
      
      return reply.send(priceList);
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error getting price list');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get price list'
      });
    }
  }
  
  /**
   * Create a new price list (admin only)
   */
  async createPriceList(request: FastifyRequest, reply: FastifyReply) {
    try {
      const priceListData = request.body as any;
      
      const priceList = await pricingService.createPriceList(priceListData);
      
      return reply.code(201).send(priceList);
    } catch (error) {
      logger.error({ error, body: request.body }, 'Error creating price list');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create price list'
      });
    }
  }
  
  /**
   * Update a price list (admin only)
   */
  async updatePriceList(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const priceListData = request.body as any;
      
      const updatedPriceList = await pricingService.updatePriceList(id, priceListData);
      
      if (!updatedPriceList) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Price list with ID ${id} not found`
        });
      }
      
      return reply.send(updatedPriceList);
    } catch (error) {
      logger.error({ error, params: request.params, body: request.body }, 'Error updating price list');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to update price list'
      });
    }
  }
  
  /**
   * Delete a price list (admin only)
   */
  async deletePriceList(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const deleted = await pricingService.deletePriceList(id);
      
      if (!deleted) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Price list with ID ${id} not found`
        });
      }
      
      return reply.code(204).send();
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error deleting price list');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete price list'
      });
    }
  }
  
  /**
   * Set price for a product (admin only)
   */
  async setProductPrice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const productPriceData = request.body as any;
      
      const productPrice = await pricingService.setProductPrice(productPriceData);
      
      return reply.code(201).send(productPrice);
    } catch (error) {
      logger.error({ error, body: request.body }, 'Error setting product price');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to set product price'
      });
    }
  }
  
  /**
   * Delete a product price (admin only)
   */
  async deleteProductPrice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const deleted = await pricingService.deleteProductPrice(id);
      
      if (!deleted) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Product price with ID ${id} not found`
        });
      }
      
      return reply.code(204).send();
    } catch (error) {
      logger.error({ error, params: request.params }, 'Error deleting product price');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete product price'
      });
    }
  }
  
  /**
   * Import prices in bulk (admin only)
   */
  async bulkImportPrices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { prices, options = {} } = request.body as { 
        prices: any[]; 
        options?: { updateExisting?: boolean; priceListId?: string } 
      };
      
      const result = await pricingService.importPrices(prices, options);
      
      return reply.code(200).send({
        message: 'Prices imported successfully',
        created: result.created,
        updated: result.updated,
        failed: result.failed
      });
    } catch (error) {
      logger.error({ error, body: request.body }, 'Error importing prices');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to import prices'
      });
    }
  }
  
  /**
   * Update prices in bulk (admin only)
   */
  async bulkUpdatePrices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { updates, options } = request.body as any;
      
      const result = await pricingService.bulkUpdatePrices(updates, options);
      
      return reply.send(result);
    } catch (error) {
      logger.error({ error }, 'Error updating prices in bulk');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to update prices in bulk'
      });
    }
  }
}

// Export singleton instance
export const pricingController = new PricingController(); 
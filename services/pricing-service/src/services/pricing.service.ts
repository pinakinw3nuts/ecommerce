import { AppDataSource } from '../config/dataSource';
import { PriceList } from '../entities/PriceList';
import { ProductPrice } from '../entities/ProductPrice';
import { Currency } from '../entities/Currency';
import { convert } from '../utils/currency';
import { createLogger } from '../utils/logger';
import { rateFetcher } from '../utils/rateFetcher';
import { In, IsNull } from 'typeorm';
import { env } from '../config/env';

const logger = createLogger('pricing-service');

/**
 * Price calculation options
 */
export interface PriceCalculationOptions {
  /** Target currency code (defaults to DEFAULT_CURRENCY from env) */
  currency?: string;
  /** Customer group IDs to consider for pricing */
  customerGroupIds?: string[];
  /** Format the price as a string with currency symbol */
  formatPrice?: boolean;
  /** Locale to use for formatting */
  locale?: string;
  /** Number of decimal places for rounding */
  decimals?: number;
}

/**
 * Price calculation result
 */
export interface PriceResult {
  /** The calculated price */
  price: number | string;
  /** Original price before discounts */
  originalPrice: number;
  /** Currency code */
  currency: string;
  /** Whether the price is on sale */
  onSale: boolean;
  /** Price list ID that was used */
  priceListId?: string;
  /** Customer group ID that was used */
  customerGroupId?: string;
  /** Applied tier information */
  appliedTier?: {
    quantity: number;
    price: number;
    name?: string;
  };
  /** Discount percentage if on sale */
  discountPercentage?: number;
}

/**
 * Service for calculating prices based on various factors
 */
export class PricingService {
  private priceListRepo = AppDataSource.getRepository(PriceList);
  private productPriceRepo = AppDataSource.getRepository(ProductPrice);
  private currencyRepo = AppDataSource.getRepository(Currency);

  /**
   * Calculate price for a product based on various factors
   */
  async calculatePrice(
    productId: string,
    quantity: number = 1,
    options: PriceCalculationOptions = {}
  ): Promise<PriceResult> {
    try {
      const {
        currency = env.DEFAULT_CURRENCY,
        customerGroupIds = [],
        formatPrice = false,
        locale = 'en-US',
        decimals = 2
      } = options;

      logger.debug({
        productId,
        quantity,
        currency,
        customerGroupIds
      }, 'Calculating price');

      // Find applicable price lists in order of priority
      const priceLists = await this.findApplicablePriceLists(customerGroupIds, currency);
      
      if (priceLists.length === 0) {
        logger.debug({ productId, currency }, 'No applicable price lists found');
        
        // If no price lists found, try to get a default price in the default currency
        const defaultPrice = await this.getDefaultPrice(productId);
        if (!defaultPrice) {
          throw new Error(`No pricing found for product ${productId}`);
        }
        
        // Convert to requested currency if needed
        return this.formatPriceResult(defaultPrice, quantity, currency, formatPrice, locale, decimals);
      }

      // Find the best price from applicable price lists
      for (const priceList of priceLists) {
        const productPrice = await this.productPriceRepo.findOne({
          where: {
            priceListId: priceList.id,
            productId,
            active: true
          }
        });

        if (productPrice) {
          return this.formatPriceResult(
            productPrice,
            quantity,
            currency,
            formatPrice,
            locale,
            decimals,
            priceList.id,
            priceList.customerGroupId
          );
        }
      }

      // If no specific price found, try to get a default price
      const defaultPrice = await this.getDefaultPrice(productId);
      if (!defaultPrice) {
        throw new Error(`No pricing found for product ${productId}`);
      }

      // Convert to requested currency if needed
      return this.formatPriceResult(defaultPrice, quantity, currency, formatPrice, locale, decimals);
    } catch (error) {
      logger.error({ error, productId, quantity }, 'Error calculating price');
      throw error;
    }
  }

  /**
   * Calculate prices for multiple products at once
   */
  async calculatePrices(
    productIds: string[],
    quantity: number = 1,
    options: PriceCalculationOptions = {}
  ): Promise<Record<string, PriceResult>> {
    try {
      const results: Record<string, PriceResult> = {};
      
      // Find applicable price lists once for all products
      const {
        currency = env.DEFAULT_CURRENCY,
        customerGroupIds = []
      } = options;
      
      const priceLists = await this.findApplicablePriceLists(customerGroupIds, currency);
      
      // Get prices for all products in the applicable price lists
      if (priceLists.length > 0) {
        const priceListIds = priceLists.map(pl => pl.id);
        
        const productPrices = await this.productPriceRepo.find({
          where: {
            priceListId: In(priceListIds),
            productId: In(productIds),
            active: true
          },
          relations: ['priceList']
        });
        
        // Group prices by product ID
        const pricesByProduct: Record<string, ProductPrice[]> = {};
        productPrices.forEach(price => {
          if (!pricesByProduct[price.productId]) {
            pricesByProduct[price.productId] = [];
          }
          pricesByProduct[price.productId].push(price);
        });
        
        // For each product, find the best price from the applicable price lists
        for (const productId of productIds) {
          const prices = pricesByProduct[productId] || [];
          
          if (prices.length > 0) {
            // Sort by price list priority
            prices.sort((a, b) => {
              const priceListA = priceLists.find(pl => pl.id === a.priceListId);
              const priceListB = priceLists.find(pl => pl.id === b.priceListId);
              return (priceListB?.priority || 0) - (priceListA?.priority || 0);
            });
            
            const bestPrice = prices[0];
            results[productId] = await this.formatPriceResult(
              bestPrice,
              quantity,
              currency,
              options.formatPrice,
              options.locale,
              options.decimals,
              bestPrice.priceListId,
              bestPrice.priceList?.customerGroupId
            );
          } else {
            // Try to get default price
            try {
              const defaultPrice = await this.getDefaultPrice(productId);
              if (defaultPrice) {
                results[productId] = await this.formatPriceResult(
                  defaultPrice,
                  quantity,
                  currency,
                  options.formatPrice,
                  options.locale,
                  options.decimals
                );
              }
            } catch (error) {
              logger.warn({ productId, error }, 'No pricing found for product');
              // Skip this product if no price found
            }
          }
        }
      } else {
        // No price lists found, try to get default prices for all products
        for (const productId of productIds) {
          try {
            const defaultPrice = await this.getDefaultPrice(productId);
            if (defaultPrice) {
              results[productId] = await this.formatPriceResult(
                defaultPrice,
                quantity,
                currency,
                options.formatPrice,
                options.locale,
                options.decimals
              );
            }
          } catch (error) {
            logger.warn({ productId, error }, 'No pricing found for product');
            // Skip this product if no price found
          }
        }
      }
      
      return results;
    } catch (error) {
      logger.error({ error, productIds, quantity }, 'Error calculating prices');
      throw error;
    }
  }

  /**
   * Find applicable price lists based on customer groups and currency
   */
  private async findApplicablePriceLists(
    customerGroupIds: string[] = [],
    currency: string = env.DEFAULT_CURRENCY
  ): Promise<PriceList[]> {
    const now = new Date();
    
    // Query for price lists that match the criteria
    const query = this.priceListRepo.createQueryBuilder('priceList')
      .where('priceList.active = :active', { active: true })
      .andWhere('priceList.currency = :currency', { currency })
      .andWhere('(priceList.startDate IS NULL OR priceList.startDate <= :now)', { now })
      .andWhere('(priceList.endDate IS NULL OR priceList.endDate >= :now)', { now })
      .orderBy('priceList.priority', 'DESC');
    
    // Add customer group filter if provided
    if (customerGroupIds.length > 0) {
      query.andWhere(`(
        priceList.customerGroupId IN (:...customerGroupIds) 
        OR priceList.customerGroupId IS NULL
      )`, { customerGroupIds });
      
      // Customer-specific price lists should be prioritized
      query.addOrderBy('CASE WHEN priceList.customerGroupId IS NULL THEN 0 ELSE 1 END', 'DESC');
    }
    
    return query.getMany();
  }

  /**
   * Get default price for a product
   */
  private async getDefaultPrice(productId: string): Promise<ProductPrice | null> {
    // Look for a price in the default price list (no customer group, default currency)
    const defaultPriceList = await this.priceListRepo.findOne({
      where: {
        currency: env.DEFAULT_CURRENCY,
        customerGroupId: IsNull(),
        active: true
      },
      order: {
        priority: 'DESC'
      }
    });

    if (defaultPriceList) {
      const defaultPrice = await this.productPriceRepo.findOne({
        where: {
          priceListId: defaultPriceList.id,
          productId,
          active: true
        }
      });

      if (defaultPrice) {
        return defaultPrice;
      }
    }

    // If no default price list or no price in default price list,
    // look for any price for this product
    return this.productPriceRepo.findOne({
      where: {
        productId,
        active: true
      },
      relations: ['priceList'],
      order: {
        priceList: { priority: 'DESC' }
      }
    });
  }

  /**
   * Format price result with currency conversion if needed
   */
  private async formatPriceResult(
    productPrice: ProductPrice,
    quantity: number,
    targetCurrency: string,
    formatPrice: boolean = false,
    locale: string = 'en-US',
    decimals: number = 2,
    priceListId?: string,
    customerGroupId?: string
  ): Promise<PriceResult> {
    // Get the effective price based on quantity (handles tiered pricing)
    const effectivePrice = productPrice.getEffectivePrice(quantity);
    
    // Get the original price (base price without tiers or discounts)
    const originalPrice = productPrice.basePrice;
    
    // Determine if price is on sale
    const now = new Date();
    const onSale = 
      productPrice.salePrice !== null && 
      productPrice.salePrice !== undefined &&
      (!productPrice.saleStartDate || productPrice.saleStartDate <= now) &&
      (!productPrice.saleEndDate || productPrice.saleEndDate >= now);
    
    // Calculate discount percentage if on sale
    let discountPercentage: number | undefined;
    if (onSale && productPrice.salePrice !== null && productPrice.salePrice !== undefined) {
      discountPercentage = Math.round(((originalPrice - productPrice.salePrice) / originalPrice) * 100);
    }
    
    // Find the applied tier if any
    let appliedTier: PriceResult['appliedTier'] | undefined;
    if (productPrice.tieredPrices && Array.isArray(productPrice.tieredPrices) && quantity > 1) {
      const applicableTiers = productPrice.tieredPrices
        .filter(tier => tier.quantity <= quantity)
        .sort((a, b) => b.quantity - a.quantity);
      
      if (applicableTiers.length > 0) {
        appliedTier = applicableTiers[0];
      }
    }
    
    // Get source currency from price list or default
    let sourceCurrency = env.DEFAULT_CURRENCY;
    if (productPrice.priceList && productPrice.priceList.currency) {
      sourceCurrency = productPrice.priceList.currency;
    }
    
    // If the price is already in the target currency, no conversion needed
    if (sourceCurrency === targetCurrency) {
      const price = formatPrice 
        ? await this.formatCurrency(effectivePrice, targetCurrency, locale, decimals)
        : Number(effectivePrice.toFixed(decimals));
        
      return {
        price,
        originalPrice: Number(originalPrice.toFixed(decimals)),
        currency: targetCurrency,
        onSale,
        priceListId: priceListId || productPrice.priceListId,
        customerGroupId,
        appliedTier,
        discountPercentage
      };
    }
    
    // Otherwise, convert the price to the target currency
    try {
      // Get exchange rates
      const rateMap = await rateFetcher.getRates();
      
      // Convert the price
      const convertedPrice = convert(
        effectivePrice,
        sourceCurrency,
        targetCurrency,
        rateMap,
        { decimals, format: formatPrice, locale }
      );
      
      // Convert the original price
      const convertedOriginalPrice = Number(
        convert(originalPrice, sourceCurrency, targetCurrency, rateMap, { decimals }).toString()
      );
      
      return {
        price: convertedPrice,
        originalPrice: convertedOriginalPrice,
        currency: targetCurrency,
        onSale,
        priceListId: priceListId || productPrice.priceListId,
        customerGroupId,
        appliedTier,
        discountPercentage
      };
    } catch (error) {
      logger.error({ 
        error, 
        sourceCurrency, 
        targetCurrency 
      }, 'Error converting currency');
      
      // Fall back to unconverted price
      const price = formatPrice 
        ? await this.formatCurrency(effectivePrice, sourceCurrency, locale, decimals)
        : Number(effectivePrice.toFixed(decimals));
        
      return {
        price,
        originalPrice: Number(originalPrice.toFixed(decimals)),
        currency: sourceCurrency,
        onSale,
        priceListId: priceListId || productPrice.priceListId,
        customerGroupId,
        appliedTier,
        discountPercentage
      };
    }
  }

  /**
   * Format a price with currency symbol
   */
  private async formatCurrency(
    amount: number,
    currencyCode: string,
    locale: string = 'en-US',
    decimals: number = 2
  ): Promise<string> {
    try {
      // Try to get currency formatting from database
      const currency = await this.currencyRepo.findOne({
        where: { code: currencyCode }
      });
      
      if (currency) {
        return currency.formatAmount(amount);
      }
      
      // Fall back to Intl formatter
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(amount);
    } catch (error) {
      logger.warn({ error, currencyCode }, 'Error formatting currency');
      
      // Simple fallback
      return `${currencyCode} ${amount.toFixed(decimals)}`;
    }
  }

  /**
   * Get price lists for specific customer groups
   */
  async getCustomerPriceLists(customerGroupIds: string[]): Promise<PriceList[]> {
    try {
      const now = new Date();
      
      return this.priceListRepo.createQueryBuilder('priceList')
        .where('priceList.active = :active', { active: true })
        .andWhere('(priceList.startDate IS NULL OR priceList.startDate <= :now)', { now })
        .andWhere('(priceList.endDate IS NULL OR priceList.endDate >= :now)', { now })
        .andWhere('priceList.customerGroupId IN (:...customerGroupIds)', { customerGroupIds })
        .orderBy('priceList.priority', 'DESC')
        .getMany();
    } catch (error) {
      logger.error({ error, customerGroupIds }, 'Error getting customer price lists');
      throw error;
    }
  }

  /**
   * Get all price lists
   */
  async getAllPriceLists(): Promise<PriceList[]> {
    try {
      return this.priceListRepo.find({
        order: { priority: 'DESC' }
      });
    } catch (error) {
      logger.error({ error }, 'Error getting all price lists');
      throw error;
    }
  }

  /**
   * Get a specific price list by ID
   */
  async getPriceList(id: string): Promise<PriceList | null> {
    try {
      return this.priceListRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error({ error, id }, 'Error getting price list');
      throw error;
    }
  }

  /**
   * Create a new price list
   */
  async createPriceList(data: Partial<PriceList>): Promise<PriceList> {
    try {
      const priceList = this.priceListRepo.create(data);
      return this.priceListRepo.save(priceList);
    } catch (error) {
      logger.error({ error, data }, 'Error creating price list');
      throw error;
    }
  }

  /**
   * Update an existing price list
   */
  async updatePriceList(id: string, data: Partial<PriceList>): Promise<PriceList | null> {
    try {
      const priceList = await this.priceListRepo.findOne({ where: { id } });
      
      if (!priceList) {
        return null;
      }
      
      Object.assign(priceList, data);
      return this.priceListRepo.save(priceList);
    } catch (error) {
      logger.error({ error, id, data }, 'Error updating price list');
      throw error;
    }
  }

  /**
   * Delete a price list
   */
  async deletePriceList(id: string): Promise<boolean> {
    try {
      const result = await this.priceListRepo.delete(id);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      logger.error({ error, id }, 'Error deleting price list');
      throw error;
    }
  }

  /**
   * Set price for a product
   */
  async setProductPrice(data: Partial<ProductPrice>): Promise<ProductPrice> {
    try {
      // Check if product price already exists
      let productPrice: ProductPrice | null = null;
      
      if (data.id) {
        productPrice = await this.productPriceRepo.findOne({ 
          where: { id: data.id }
        });
      } else if (data.productId && data.priceListId) {
        productPrice = await this.productPriceRepo.findOne({ 
          where: { 
            productId: data.productId,
            priceListId: data.priceListId
          }
        });
      }
      
      if (productPrice) {
        // Update existing
        Object.assign(productPrice, data);
      } else {
        // Create new
        productPrice = this.productPriceRepo.create(data);
      }
      
      return this.productPriceRepo.save(productPrice);
    } catch (error) {
      logger.error({ error, data }, 'Error setting product price');
      throw error;
    }
  }

  /**
   * Delete a product price
   */
  async deleteProductPrice(id: string): Promise<boolean> {
    try {
      const result = await this.productPriceRepo.delete(id);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      logger.error({ error, id }, 'Error deleting product price');
      throw error;
    }
  }

  /**
   * Import prices in bulk
   */
  async importPrices(
    prices: Partial<ProductPrice>[],
    options: { updateExisting?: boolean; priceListId?: string } = {}
  ): Promise<{ created: number; updated: number; failed: number }> {
    try {
      let created = 0;
      let updated = 0;
      let failed = 0;
      
      for (const priceData of prices) {
        try {
          // If priceListId is provided in options, use it
          if (options.priceListId && !priceData.priceListId) {
            priceData.priceListId = options.priceListId;
          }
          
          // Skip if no product ID or price list ID
          if (!priceData.productId || !priceData.priceListId) {
            failed++;
            continue;
          }
          
          // Check if price already exists
          const existingPrice = await this.productPriceRepo.findOne({
            where: {
              productId: priceData.productId,
              priceListId: priceData.priceListId
            }
          });
          
          if (existingPrice) {
            if (options.updateExisting) {
              // Update existing price
              Object.assign(existingPrice, priceData);
              await this.productPriceRepo.save(existingPrice);
              updated++;
            } else {
              // Skip if not updating existing
              failed++;
            }
          } else {
            // Create new price
            const newPrice = this.productPriceRepo.create(priceData);
            await this.productPriceRepo.save(newPrice);
            created++;
          }
        } catch (error) {
          logger.error({ error, priceData }, 'Error importing price');
          failed++;
        }
      }
      
      return { created, updated, failed };
    } catch (error) {
      logger.error({ error }, 'Error importing prices');
      throw error;
    }
  }

  /**
   * Update prices in bulk
   */
  async bulkUpdatePrices(
    updates: Array<{ id: string; changes: Partial<ProductPrice> }>,
    options: { failOnError?: boolean } = {}
  ): Promise<{ updated: number; failed: number; failures: Array<{ id: string; error: string }> }> {
    try {
      let updated = 0;
      let failed = 0;
      const failures: Array<{ id: string; error: string }> = [];
      
      for (const { id, changes } of updates) {
        try {
          const price = await this.productPriceRepo.findOne({ where: { id } });
          
          if (!price) {
            const error = `Price with ID ${id} not found`;
            failures.push({ id, error });
            failed++;
            
            if (options.failOnError) {
              throw new Error(error);
            }
            
            continue;
          }
          
          Object.assign(price, changes);
          await this.productPriceRepo.save(price);
          updated++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failures.push({ id, error: errorMessage });
          failed++;
          
          if (options.failOnError) {
            throw error;
          }
        }
      }
      
      return { updated, failed, failures };
    } catch (error) {
      logger.error({ error }, 'Error bulk updating prices');
      throw error;
    }
  }
}

// Export singleton instance
export const pricingService = new PricingService(); 
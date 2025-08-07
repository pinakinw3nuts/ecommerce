import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PriceList } from '../entities/PriceList';
import { ProductPrice } from '../entities/ProductPrice';
import { Currency } from '../entities/Currency';
import { convert } from '../utils/currency';
import { logger } from '../utils/logger';
import { rateFetcher } from '../utils/rateFetcher';

const pricingLogger = logger.child({ service: 'PricingService' });

/**
 * Price calculation options
 */
export interface PriceCalculationOptions {
  /** Target currency code (defaults to USD) */
  currency?: string;
  /** Customer group IDs to consider for pricing */
  customerGroupIds?: string[];
  /** Format the price as a string with currency symbol */
  formatPrice?: boolean;
  /** Locale to use for formatting */
  locale?: string;
  /** Number of decimal places for rounding */
  decimals?: number;
  /** Quantity for tiered pricing */
  quantity?: number;
}

/**
 * Result of price calculation
 */
export interface PriceResult {
  /** The calculated price */
  price: number | string;
  /** Original price before any discounts */
  originalPrice: number;
  /** Currency code */
  currency: string;
  /** Whether the product is on sale */
  onSale: boolean;
  /** ID of the price list used */
  priceListId?: string;
  /** Customer group ID if applicable */
  customerGroupId?: string;
  /** Applied tier if any */
  appliedTier?: {
    quantity: number;
    price: number;
    discount?: number;
  };
  /** Discount percentage if on sale */
  discountPercentage?: number;
}

/**
 * Service for calculating prices based on various factors
 */
export class PricingService {
  private priceListRepo: Repository<PriceList>;
  private productPriceRepo: Repository<ProductPrice>;
  private currencyRepo: Repository<Currency>;

  constructor() {
    this.priceListRepo = AppDataSource.getRepository(PriceList);
    this.productPriceRepo = AppDataSource.getRepository(ProductPrice);
    this.currencyRepo = AppDataSource.getRepository(Currency);
  }

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
        currency = 'USD',
        customerGroupIds = [],
        formatPrice = false,
        locale = 'en-US',
        decimals = 2
      } = options;

      pricingLogger.debug({
        productId,
        quantity,
        currency,
        customerGroupIds
      }, 'Calculating price');

      // Find applicable price lists in order of priority
      const priceLists = await this.findApplicablePriceLists(customerGroupIds, currency);
      
      if (priceLists.length === 0) {
        pricingLogger.debug({ productId, currency }, 'No applicable price lists found');
        
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
      pricingLogger.error({ error, productId, quantity }, 'Error calculating price');
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
        currency = 'USD',
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
              pricingLogger.warn({ productId, error }, 'No pricing found for product');
              // Skip this product if no price found
            }
          }
        }
      } else {
        // No price lists found, try to get default prices
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
            pricingLogger.warn({ productId, error }, 'No pricing found for product');
            // Skip this product if no price found
          }
        }
      }
      
      return results;
    } catch (error) {
      pricingLogger.error({ error, productIds, quantity }, 'Error calculating prices');
      throw error;
    }
  }

  /**
   * Find applicable price lists based on customer groups and currency
   */
  private async findApplicablePriceLists(
    customerGroupIds: string[] = [],
    currency: string = 'USD'
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
   * Get default price for a product (fallback when no price lists apply)
   */
  private async getDefaultPrice(productId: string): Promise<ProductPrice | null> {
    // Try to find any active price for the product
    return this.productPriceRepo.findOne({
      where: {
        productId,
        active: true
      },
      relations: ['priceList'],
      order: {
        priceList: {
          priority: 'DESC'
        }
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
    let sourceCurrency = 'USD';
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
      pricingLogger.error({ error, sourceCurrency, targetCurrency }, 'Error converting currency');
      throw new Error(`Failed to convert currency from ${sourceCurrency} to ${targetCurrency}`);
    }
  }

  /**
   * Format currency using Intl.NumberFormat
   */
  private async formatCurrency(
    amount: number,
    currency: string,
    locale: string,
    decimals: number
  ): Promise<string> {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(amount);
    } catch (error) {
      pricingLogger.warn({ error, currency, locale }, 'Error formatting currency');
      return `${currency} ${amount.toFixed(decimals)}`;
    }
  }

  /**
   * Get all active currencies
   */
  async getActiveCurrencies(): Promise<Currency[]> {
    return this.currencyRepo.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', code: 'ASC' }
    });
  }

  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string): Promise<Currency | null> {
    return this.currencyRepo.findOne({
      where: { code, isActive: true }
    });
  }

  /**
   * Update currency exchange rate
   */
  async updateCurrencyRate(code: string, rate: number): Promise<Currency> {
    const currency = await this.getCurrencyByCode(code);
    if (!currency) {
      throw new Error(`Currency ${code} not found`);
    }

    currency.exchangeRate = rate;
    currency.rateLastUpdated = new Date();
    
    return this.currencyRepo.save(currency);
  }
} 
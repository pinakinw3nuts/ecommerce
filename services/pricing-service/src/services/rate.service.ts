import { AppDataSource } from '../config/dataSource';
import { Currency } from '../entities/Currency';
import { rateFetcher } from '../utils/rateFetcher';
import { createLogger } from '../utils/logger';
import { env } from '../config/env';
import { RateMap } from '../utils/currency';

const logger = createLogger('rate-service');

// Define types
interface RateHistoryEntry {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  timestamp: string;
  source: string;
}

interface RateHistoryOptions {
  baseCurrency?: string;
  targetCurrency?: string;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

interface SetRateOptions {
  source?: string;
  timestamp?: Date;
}

/**
 * Service for managing currency exchange rates
 */
export class RateService {
  private currencyRepo = AppDataSource.getRepository(Currency);
  private updateInterval?: NodeJS.Timeout;
  private isUpdating: boolean = false;
  private lastUpdateTime?: Date;
  private rateHistory: RateHistoryEntry[] = [];

  constructor() {
    logger.info('RateService initialized');
  }

  /**
   * Initialize the rate service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing rate service');
      
      // Ensure default currency exists
      await this.ensureDefaultCurrency();
      
      // Perform initial rate update
      await this.updateAllRates();
      
      // Set up automatic updates if interval is configured
      if (env.CURRENCY_UPDATE_INTERVAL > 0) {
        this.startPeriodicUpdates(env.CURRENCY_UPDATE_INTERVAL * 1000);
      }
      
      logger.info('Rate service initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize rate service');
      throw error;
    }
  }

  /**
   * Ensure the default currency exists in the database
   */
  private async ensureDefaultCurrency(): Promise<Currency> {
    try {
      // Check if default currency exists
      let defaultCurrency = await this.currencyRepo.findOne({
        where: { code: env.DEFAULT_CURRENCY }
      });
      
      if (!defaultCurrency) {
        // Create default currency
        defaultCurrency = this.currencyRepo.create({
          code: env.DEFAULT_CURRENCY,
          name: this.getCurrencyName(env.DEFAULT_CURRENCY),
          symbol: this.getCurrencySymbol(env.DEFAULT_CURRENCY),
          exchangeRate: 1, // Base currency always has rate of 1
          isDefault: true,
          isActive: true,
          decimalPlaces: 2,
          rateLastUpdated: new Date()
        });
        
        await this.currencyRepo.save(defaultCurrency);
        logger.info({ currency: defaultCurrency.code }, 'Created default currency');
      } else if (!defaultCurrency.isDefault) {
        // Update existing currency to be default
        defaultCurrency.isDefault = true;
        defaultCurrency.exchangeRate = 1;
        await this.currencyRepo.save(defaultCurrency);
        logger.info({ currency: defaultCurrency.code }, 'Updated default currency');
      }
      
      return defaultCurrency;
    } catch (error) {
      logger.error({ error }, 'Failed to ensure default currency');
      throw error;
    }
  }

  /**
   * Start periodic updates of currency rates
   */
  public startPeriodicUpdates(intervalMs: number): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllRates();
      } catch (error) {
        logger.error({ error }, 'Failed to update currency rates');
      }
    }, intervalMs);

    logger.info({ intervalMs }, 'Started periodic currency rate updates');
  }

  /**
   * Stop periodic updates
   */
  public stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
      logger.info('Stopped periodic currency rate updates');
    }
  }

  /**
   * Update rates for all active currencies
   */
  public async updateAllRates(): Promise<void> {
    // Prevent concurrent updates
    if (this.isUpdating) {
      logger.debug('Rate update already in progress, skipping');
      return;
    }
    
    this.isUpdating = true;
    
    try {
      logger.info('Updating all currency rates');
      
      // Get all active currencies
      const currencies = await this.currencyRepo.find({
        where: { isActive: true }
      });
      
      if (currencies.length === 0) {
        logger.warn('No active currencies found');
        return;
      }
      
      // Fetch latest rates from external service
      const rateMap = await rateFetcher.getRates();
      
      // Update rates in database
      const updates = currencies
        .filter(currency => currency.code !== env.DEFAULT_CURRENCY) // Skip default currency
        .map(currency => {
          // Type assertion to handle the rates structure
          const rates = rateMap as unknown as { rates: Record<string, number> };
          const rate = rates.rates[currency.code];
          
          if (!rate) {
            logger.warn({ currency: currency.code }, 'No rate found for currency');
            return null;
          }
          
          currency.exchangeRate = rate;
          currency.rateLastUpdated = new Date();
          
          return currency;
        })
        .filter(Boolean) as Currency[];
      
      if (updates.length > 0) {
        await this.currencyRepo.save(updates);
        logger.info({ count: updates.length }, 'Updated currency rates');
      }
      
      this.lastUpdateTime = new Date();
    } catch (error) {
      logger.error({ error }, 'Failed to update all currency rates');
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Get all currencies with their current rates
   */
  public async getAllCurrencies(): Promise<Currency[]> {
    try {
      return this.currencyRepo.find({
        order: {
          isDefault: 'DESC',
          code: 'ASC'
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get all currencies');
      throw error;
    }
  }

  /**
   * Get active currencies with their current rates
   */
  public async getActiveCurrencies(): Promise<Currency[]> {
    try {
      return this.currencyRepo.find({
        where: { isActive: true },
        order: {
          isDefault: 'DESC',
          code: 'ASC'
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get active currencies');
      throw error;
    }
  }

  /**
   * Get a currency by code
   */
  public async getCurrencyByCode(code: string): Promise<Currency | null> {
    try {
      return this.currencyRepo.findOne({
        where: { code }
      });
    } catch (error) {
      logger.error({ error, code }, 'Failed to get currency by code');
      throw error;
    }
  }

  /**
   * Create or update a currency
   */
  public async createOrUpdateCurrency(data: {
    code: string;
    name: string;
    symbol?: string;
    exchangeRate?: number;
    isActive?: boolean;
    decimalPlaces?: number;
    format?: string;
  }): Promise<Currency> {
    try {
      // Check if currency exists
      let currency = await this.currencyRepo.findOne({
        where: { code: data.code }
      });
      
      if (currency) {
        // Update existing currency
        currency.name = data.name;
        if (data.symbol !== undefined) currency.symbol = data.symbol;
        if (data.exchangeRate !== undefined && !currency.isDefault) {
          currency.exchangeRate = data.exchangeRate;
          currency.rateLastUpdated = new Date();
        }
        if (data.isActive !== undefined) currency.isActive = data.isActive;
        if (data.decimalPlaces !== undefined) currency.decimalPlaces = data.decimalPlaces;
        if (data.format !== undefined) currency.format = data.format;
      } else {
        // Create new currency
        currency = this.currencyRepo.create({
          code: data.code,
          name: data.name,
          symbol: data.symbol || data.code,
          exchangeRate: data.exchangeRate || 1,
          isDefault: false,
          isActive: data.isActive !== undefined ? data.isActive : true,
          decimalPlaces: data.decimalPlaces || 2,
          format: data.format,
          rateLastUpdated: new Date()
        });
      }
      
      const savedCurrency = await this.currencyRepo.save(currency);
      logger.info({ currency: savedCurrency.code }, 'Currency created or updated');
      
      return savedCurrency;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create or update currency');
      throw error;
    }
  }

  /**
   * Set a currency as the default
   */
  public async setDefaultCurrency(code: string): Promise<Currency> {
    try {
      // Get the currency
      const currency = await this.currencyRepo.findOne({
        where: { code }
      });
      
      if (!currency) {
        throw new Error(`Currency with code ${code} not found`);
      }
      
      // Update the current default currency
      await this.currencyRepo.update(
        { isDefault: true },
        { isDefault: false }
      );
      
      // Set the new default currency
      currency.isDefault = true;
      currency.exchangeRate = 1; // Default currency always has rate of 1
      currency.rateLastUpdated = new Date();
      
      const savedCurrency = await this.currencyRepo.save(currency);
      
      // Update env variable
      process.env.DEFAULT_CURRENCY = code;
      
      logger.info({ currency: code }, 'Set default currency');
      
      // Update all rates to be relative to the new default
      await this.updateAllRates();
      
      return savedCurrency;
    } catch (error) {
      logger.error({ error, code }, 'Failed to set default currency');
      throw error;
    }
  }

  /**
   * Delete a currency
   */
  public async deleteCurrency(code: string): Promise<boolean> {
    try {
      // Check if currency is default
      const currency = await this.currencyRepo.findOne({
        where: { code }
      });
      
      if (!currency) {
        throw new Error(`Currency with code ${code} not found`);
      }
      
      if (currency.isDefault) {
        throw new Error('Cannot delete default currency');
      }
      
      // Delete the currency
      await this.currencyRepo.remove(currency);
      
      logger.info({ currency: code }, 'Currency deleted');
      
      return true;
    } catch (error) {
      logger.error({ error, code }, 'Failed to delete currency');
      throw error;
    }
  }

  /**
   * Force refresh rates from external service
   */
  public async forceRefreshRates(): Promise<void> {
    try {
      logger.info('Force refreshing currency rates');
      
      // Use fetchRates with force option instead of clearCache
      await rateFetcher.fetchRates({ force: true });
      
      // Update all rates
      await this.updateAllRates();
      
      logger.info('Force refreshed currency rates');
    } catch (error) {
      logger.error({ error }, 'Failed to force refresh currency rates');
      throw error;
    }
  }

  /**
   * Get last update time
   */
  public getLastUpdateTime(): Date | undefined {
    return this.lastUpdateTime;
  }

  /**
   * Get currency name based on code
   * This is a fallback if name is not provided
   */
  private getCurrencyName(code: string): string {
    const currencyNames: Record<string, string> = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      CHF: 'Swiss Franc',
      CNY: 'Chinese Yuan',
      INR: 'Indian Rupee',
      BRL: 'Brazilian Real',
      RUB: 'Russian Ruble'
    };
    
    return currencyNames[code] || `${code} Currency`;
  }

  /**
   * Get currency symbol based on code
   * This is a fallback if symbol is not provided
   */
  private getCurrencySymbol(code: string): string {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'Fr',
      CNY: '¥',
      INR: '₹',
      BRL: 'R$',
      RUB: '₽'
    };
    
    return currencySymbols[code] || code;
  }

  /**
   * Sync rates to the database
   * 
   * @param rates Map of currency rates
   * @param options Options for syncing rates
   */
  async syncRates(rates: RateMap, options: { source: string }): Promise<void> {
    const timestamp = new Date();
    const { source } = options;
    
    // In a real implementation, this would update a database
    // For now, we'll just add entries to our in-memory history
    
    // Add each rate to history
    Object.entries(rates).forEach(([currency, rate]) => {
      if (currency !== 'USD') {
        this.rateHistory.push({
          baseCurrency: 'USD',
          targetCurrency: currency,
          rate,
          timestamp: timestamp.toISOString(),
          source
        });
      }
    });
    
    logger.info({ 
      rateCount: Object.keys(rates).length - 1, // Subtract 1 for USD
      source 
    }, 'Synced rates to database');
  }

  /**
   * Set a specific exchange rate
   * 
   * @param baseCurrency Base currency code
   * @param targetCurrency Target currency code
   * @param rate Exchange rate
   * @param options Options for setting the rate
   */
  async setRate(
    baseCurrency: string,
    targetCurrency: string,
    rate: number,
    options: SetRateOptions = {}
  ): Promise<void> {
    if (baseCurrency === targetCurrency) {
      throw new Error('Base currency and target currency must be different');
    }
    
    if (rate <= 0) {
      throw new Error('Rate must be positive');
    }
    
    const timestamp = options.timestamp || new Date();
    const source = options.source || 'manual';
    
    // In a real implementation, this would update a database
    // For now, we'll just add an entry to our in-memory history
    this.rateHistory.push({
      baseCurrency,
      targetCurrency,
      rate,
      timestamp: timestamp.toISOString(),
      source
    });
    
    logger.info({ 
      baseCurrency, 
      targetCurrency, 
      rate, 
      source 
    }, 'Rate set manually');
  }

  /**
   * Delete a specific exchange rate
   * 
   * @param baseCurrency Base currency code
   * @param targetCurrency Target currency code
   * @returns Whether a rate was deleted
   */
  async deleteRate(baseCurrency: string, targetCurrency: string): Promise<boolean> {
    // In a real implementation, this would update a database
    // For now, we'll just check if there are any entries in our history
    
    const initialLength = this.rateHistory.length;
    
    // Remove all entries for this currency pair
    this.rateHistory = this.rateHistory.filter(
      entry => !(entry.baseCurrency === baseCurrency && entry.targetCurrency === targetCurrency)
    );
    
    const deleted = this.rateHistory.length < initialLength;
    
    if (deleted) {
      logger.info({ baseCurrency, targetCurrency }, 'Rate deleted');
    } else {
      logger.warn({ baseCurrency, targetCurrency }, 'No rate found to delete');
    }
    
    return deleted;
  }

  /**
   * Get rate history
   * 
   * @param options Options for filtering history
   * @returns Rate history entries and total count
   */
  async getRateHistory(options: RateHistoryOptions): Promise<{
    history: RateHistoryEntry[];
    total: number;
  }> {
    const { 
      baseCurrency, 
      targetCurrency, 
      startDate, 
      endDate, 
      limit, 
      offset 
    } = options;
    
    // Filter history based on options
    let filteredHistory = [...this.rateHistory];
    
    if (baseCurrency) {
      filteredHistory = filteredHistory.filter(entry => entry.baseCurrency === baseCurrency);
    }
    
    if (targetCurrency) {
      filteredHistory = filteredHistory.filter(entry => entry.targetCurrency === targetCurrency);
    }
    
    if (startDate) {
      filteredHistory = filteredHistory.filter(
        entry => new Date(entry.timestamp) >= startDate
      );
    }
    
    if (endDate) {
      filteredHistory = filteredHistory.filter(
        entry => new Date(entry.timestamp) <= endDate
      );
    }
    
    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Apply pagination
    const total = filteredHistory.length;
    const paginatedHistory = filteredHistory.slice(offset, offset + limit);
    
    logger.debug({ 
      filters: { baseCurrency, targetCurrency, startDate, endDate },
      total,
      returned: paginatedHistory.length
    }, 'Retrieved rate history');
    
    return {
      history: paginatedHistory,
      total
    };
  }
}

// Export singleton instance
export const rateService = new RateService(); 
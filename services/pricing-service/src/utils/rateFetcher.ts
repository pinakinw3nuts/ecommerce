import { createLogger } from './logger';
import { env } from '../config/env';

const logger = createLogger('rate-fetcher');

// Define types
interface RateMap {
  [currency: string]: number;
}

interface RateMetadata {
  lastUpdated: string;
  source: string;
  nextUpdate?: string;
}

/**
 * Utility for fetching and caching currency exchange rates
 */
class RateFetcher {
  private rates: RateMap = {};
  private metadata: RateMetadata = {
    lastUpdated: new Date().toISOString(),
    source: 'default'
  };
  private lastFetchTime: number = 0;
  private cacheTTL: number = env.CACHE_TTL * 1000; // Convert to milliseconds

  constructor() {
    // Initialize with default rates
    this.rates = {
      USD: 1,
      EUR: 0.85,
      GBP: 0.75,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35
    };
    
    logger.info('RateFetcher initialized with default rates');
  }

  /**
   * Get current exchange rates
   */
  async getRates(): Promise<RateMap> {
    // Check if we need to refresh rates
    const now = Date.now();
    if (now - this.lastFetchTime > this.cacheTTL) {
      try {
        await this.fetchRates({ force: false });
      } catch (err) {
        const error = err as Error;
        logger.warn({ error: error.message }, 'Failed to refresh rates, using cached rates');
      }
    }
    
    return { ...this.rates };
  }

  /**
   * Get metadata about the current rates
   */
  async getMetadata(): Promise<RateMetadata> {
    return { ...this.metadata };
  }

  /**
   * Force fetch of latest rates
   */
  async fetchRates(options: { force?: boolean; source?: string } = {}): Promise<{
    updated: boolean;
    rates: RateMap;
    timestamp: string;
    source: string;
  }> {
    const now = Date.now();
    const { force = false, source = env.CURRENCY_API_URL } = options;
    
    // Skip if cache is still valid and not forced
    if (!force && now - this.lastFetchTime < this.cacheTTL) {
      logger.debug('Using cached rates (cache still valid)');
      return {
        updated: false,
        rates: { ...this.rates },
        timestamp: this.metadata.lastUpdated,
        source: this.metadata.source
      };
    }
    
    try {
      logger.info({ source }, 'Fetching exchange rates');
      
      // In a real implementation, this would call an external API
      // For now, we'll simulate a fetch with random fluctuations
      const updatedRates = await this.simulateFetch(source || '');
      
      // Update cache
      this.rates = updatedRates;
      this.lastFetchTime = now;
      this.metadata = {
        lastUpdated: new Date().toISOString(),
        source: source || 'simulated',
        nextUpdate: new Date(now + this.cacheTTL).toISOString()
      };
      
      logger.info({ 
        rateCount: Object.keys(updatedRates).length,
        source: this.metadata.source
      }, 'Exchange rates updated successfully');
      
      return {
        updated: true,
        rates: { ...this.rates },
        timestamp: this.metadata.lastUpdated,
        source: this.metadata.source
      };
    } catch (err) {
      const error = err as Error;
      logger.error({ error: error.message, source }, 'Error fetching exchange rates');
      throw new Error(`Failed to fetch exchange rates: ${error.message}`);
    }
  }

  /**
   * Simulate fetching rates from an external API
   * In a real implementation, this would call the actual API
   */
  private async simulateFetch(source: string): Promise<RateMap> {
    // Add a small delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // If we have a real API URL, try to use it
    if (source && source.startsWith('http') && env.CURRENCY_API_KEY) {
      try {
        // This is a placeholder for a real API call
        // In a real implementation, this would be replaced with actual API call
        logger.info('Would fetch from real API, but using simulation instead');
        // Simulated API response
      } catch (err) {
        const error = err as Error;
        logger.warn({ error: error.message, source }, 'Failed to fetch from real API, using simulation');
      }
    }
    
    // If real API fails or isn't configured, use simulated data
    const baseRates = { ...this.rates };
    const updatedRates: RateMap = { USD: 1 }; // Base currency is always 1
    
    // Add small random fluctuations to existing rates
    Object.keys(baseRates).forEach(currency => {
      if (currency !== 'USD') {
        const currentRate = baseRates[currency];
        const fluctuation = (Math.random() - 0.5) * 0.02; // +/- 1%
        updatedRates[currency] = +(currentRate * (1 + fluctuation)).toFixed(6);
      }
    });
    
    return updatedRates;
  }

  /**
   * Manually set a specific exchange rate
   */
  async setRate(baseCurrency: string, targetCurrency: string, rate: number): Promise<void> {
    // In a real implementation, this would update the database
    // For now, we just update the in-memory cache
    
    if (baseCurrency === targetCurrency) {
      throw new Error('Base currency and target currency must be different');
    }
    
    if (rate <= 0) {
      throw new Error('Rate must be positive');
    }
    
    // If base currency is not USD, we need to convert the rate
    if (baseCurrency !== 'USD') {
      // Get the base currency's rate against USD
      const baseToUsd = this.rates[baseCurrency];
      if (!baseToUsd) {
        throw new Error(`Currency rate not found for ${baseCurrency}`);
      }
      
      // Convert the rate to be based on USD
      const usdToTarget = rate / baseToUsd;
      this.rates[targetCurrency] = usdToTarget;
    } else {
      // Base is USD, simply set the rate
      this.rates[targetCurrency] = rate;
    }
    
    // Update metadata
    this.metadata.lastUpdated = new Date().toISOString();
    this.metadata.source = 'manual';
    
    logger.info({
      baseCurrency,
      targetCurrency,
      rate
    }, 'Rate manually updated');
  }

  /**
   * Delete a specific exchange rate
   */
  async deleteRate(baseCurrency: string, targetCurrency: string): Promise<void> {
    // In a real implementation, this would update the database
    // For now, we just update the in-memory cache
    
    if (baseCurrency === 'USD' && targetCurrency in this.rates) {
      delete this.rates[targetCurrency];
      
      // Update metadata
      this.metadata.lastUpdated = new Date().toISOString();
      this.metadata.source = 'manual';
      
      logger.info({
        baseCurrency,
        targetCurrency
      }, 'Rate manually deleted');
    } else {
      throw new Error(`Cannot delete rate for ${baseCurrency}/${targetCurrency}`);
    }
  }
}

// Export singleton instance
export const rateFetcher = new RateFetcher(); 
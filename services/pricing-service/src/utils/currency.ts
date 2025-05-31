import { createLogger } from './logger';

const logger = createLogger('currency-utils');

// Define types
export interface RateMap {
  [currency: string]: number;
}

export interface ConversionOptions {
  format?: boolean;
  locale?: string;
  decimals?: number;
}

/**
 * Convert an amount from one currency to another
 * 
 * @param amount The amount to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @param rateMap Map of currency rates (with USD as base)
 * @param options Formatting options
 * @returns The converted amount (formatted as string if format is true)
 */
export function convert(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rateMap: RateMap,
  options: ConversionOptions = {}
): number | string {
  // Validate inputs
  if (amount < 0) {
    throw new Error('Amount must be non-negative');
  }
  
  if (!fromCurrency || !toCurrency) {
    throw new Error('Currency codes are required');
  }
  
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return formatIfNeeded(amount, toCurrency, options);
  }
  
  // Get rates
  const fromRate = rateMap[fromCurrency];
  const toRate = rateMap[toCurrency];
  
  if (fromRate === undefined) {
    throw new Error(`Currency rate not found for ${fromCurrency}`);
  }
  
  if (toRate === undefined) {
    throw new Error(`Currency rate not found for ${toCurrency}`);
  }
  
  // Calculate conversion
  // First convert to USD (base currency), then to target currency
  const amountInUSD = fromCurrency === 'USD' ? amount : amount / fromRate;
  const convertedAmount = toCurrency === 'USD' ? amountInUSD : amountInUSD * toRate;
  
  // Round to specified decimals
  const decimals = options.decimals !== undefined ? options.decimals : 2;
  const roundedAmount = Number(convertedAmount.toFixed(decimals));
  
  // Format if needed
  return formatIfNeeded(roundedAmount, toCurrency, options);
}

/**
 * Format an amount with currency symbol if requested
 * 
 * @param amount The amount to format
 * @param currencyCode The currency code
 * @param options Formatting options
 * @returns Formatted amount as string if format is true, otherwise the number
 */
function formatIfNeeded(
  amount: number,
  currencyCode: string,
  options: ConversionOptions
): number | string {
  if (!options.format) {
    return amount;
  }
  
  const locale = options.locale || 'en-US';
  const decimals = options.decimals !== undefined ? options.decimals : 2;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  } catch (err) {
    const error = err as Error;
    logger.warn({ error: error.message, currencyCode, locale }, 'Error formatting currency');
    return amount.toFixed(decimals);
  }
}

/**
 * Map of currency rates relative to a base currency
 */
export interface CurrencyRateMap {
  /** Base currency code */
  base: string;
  /** Map of currency codes to their rates relative to the base currency */
  rates: Record<string, number>;
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rateMap: CurrencyRateMap
): number {
  const { base, rates } = rateMap;
  
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  // Get rate from base to source currency
  const fromRate = fromCurrency === base ? 1 : rates[fromCurrency];
  if (fromRate === undefined) {
    throw new Error(`Currency rate not found for ${fromCurrency}`);
  }
  
  // Get rate from base to target currency
  const toRate = toCurrency === base ? 1 : rates[toCurrency];
  if (toRate === undefined) {
    throw new Error(`Currency rate not found for ${toCurrency}`);
  }
  
  // Calculate the exchange rate
  return toRate / fromRate;
} 
/**
 * Utility functions for formatting values in the storefront application
 */

/**
 * Format a number as a price with currency symbol
 * @param price - The price to format
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price)) {
    return '$0.00'; // Return a default value for invalid numbers
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Format a percentage value
 * @param value - The decimal value to format as percentage
 * @param decimals - Number of decimal places to show
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date to a readable string
 * @param date - Date string or Date object
 * @param format - Format style ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric',
  };
  
  if (format === 'long') {
    options.hour = 'numeric';
    options.minute = 'numeric';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}
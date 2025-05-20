import logger from './logger';

interface PriceCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

/**
 * Rounds a number to 2 decimal places for currency calculations
 */
const roundToDecimal = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Validates price inputs and throws error if invalid
 */
const validateInputs = (subtotal: number, discount: number, taxRate: number): void => {
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative');
  }
  if (discount < 0 || discount > 100) {
    throw new Error('Discount must be between 0 and 100');
  }
  if (taxRate < 0 || taxRate > 100) {
    throw new Error('Tax rate must be between 0 and 100');
  }
};

/**
 * Calculates final price including discount and tax
 * @param subtotal - Original price before discount and tax
 * @param discount - Discount percentage (0-100)
 * @param taxRate - Tax rate percentage (0-100)
 * @returns Object containing subtotal, discount amount, tax amount and final total
 */
export const calculatePrice = (
  subtotal: number,
  discount: number = 0,
  taxRate: number = 0
): PriceCalculationResult => {
  try {
    // Validate inputs
    validateInputs(subtotal, discount, taxRate);

    // Calculate discount amount
    const discountAmount = roundToDecimal((subtotal * discount) / 100);
    
    // Calculate price after discount
    const priceAfterDiscount = roundToDecimal(subtotal - discountAmount);
    
    // Calculate tax amount
    const taxAmount = roundToDecimal((priceAfterDiscount * taxRate) / 100);
    
    // Calculate final total
    const total = roundToDecimal(priceAfterDiscount + taxAmount);

    const result = {
      subtotal: roundToDecimal(subtotal),
      discountAmount,
      taxAmount,
      total,
    };

    logger.debug({ 
      calculation: result,
      inputs: { subtotal, discount, taxRate }
    }, 'Price calculation completed');

    return result;
  } catch (error) {
    logger.error({ 
      error,
      inputs: { subtotal, discount, taxRate }
    }, 'Price calculation failed');
    throw error;
  }
};

/**
 * Calculates bulk prices for multiple items
 * @param items - Array of items with quantity and unit price
 * @param discount - Overall discount percentage (0-100)
 * @param taxRate - Tax rate percentage (0-100)
 */
export const calculateBulkPrice = (
  items: Array<{ quantity: number; unitPrice: number }>,
  discount: number = 0,
  taxRate: number = 0
): PriceCalculationResult => {
  try {
    // Calculate subtotal
    const subtotal = roundToDecimal(
      items.reduce((sum, item) => {
        if (item.quantity < 0 || item.unitPrice < 0) {
          throw new Error('Quantity and unit price must be positive');
        }
        return sum + (item.quantity * item.unitPrice);
      }, 0)
    );

    // Use the standard calculation function
    return calculatePrice(subtotal, discount, taxRate);
  } catch (error) {
    logger.error({ 
      error,
      inputs: { items, discount, taxRate }
    }, 'Bulk price calculation failed');
    throw error;
  }
};

// Export types
export type { PriceCalculationResult }; 
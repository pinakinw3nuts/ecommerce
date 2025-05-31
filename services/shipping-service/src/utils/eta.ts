import { logger } from './logger';

export interface ETAResult {
  days: number;
  estimatedDeliveryDate: Date;
}

/**
 * Shipping method types
 */
export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  ECONOMY = 'economy'
}

/**
 * Zone classification based on pincode ranges
 */
enum ZoneType {
  ZONE_A = 'A', // Metro cities
  ZONE_B = 'B', // Tier 2 cities
  ZONE_C = 'C', // Tier 3 cities and towns
  ZONE_D = 'D'  // Remote areas
}

/**
 * Base delivery times by shipping method (in days)
 */
const baseDeliveryTimes = {
  [ShippingMethod.STANDARD]: 3,
  [ShippingMethod.EXPRESS]: 2,
  [ShippingMethod.OVERNIGHT]: 1,
  [ShippingMethod.ECONOMY]: 5
};

/**
 * Zone-based additional days
 */
const zoneDeliveryAddition = {
  [ZoneType.ZONE_A]: 0,
  [ZoneType.ZONE_B]: 1,
  [ZoneType.ZONE_C]: 2,
  [ZoneType.ZONE_D]: 4
};

/**
 * Determine zone based on pincode (mock implementation)
 * @param pincode - The delivery location pincode
 * @returns The determined zone type
 */
function determineZone(pincode: string): ZoneType {
  // Mock logic based on first digit of pincode
  const firstDigit = parseInt(pincode.charAt(0), 10);
  
  if (firstDigit <= 2) {
    return ZoneType.ZONE_A;
  } else if (firstDigit <= 5) {
    return ZoneType.ZONE_B;
  } else if (firstDigit <= 8) {
    return ZoneType.ZONE_C;
  } else {
    return ZoneType.ZONE_D;
  }
}

/**
 * Calculate estimated time of arrival based on pincode and shipping method
 * @param pincode - Delivery location pincode
 * @param methodCode - Shipping method code
 * @returns ETA calculation result
 */
export function calculateETA(pincode: string, methodCode: string): ETAResult {
  try {
    // Base days based on shipping method
    let baseDays = 0;
    
    switch (methodCode) {
      case 'standard':
        baseDays = 3;
        break;
      case 'express':
        baseDays = 1;
        break;
      case 'same_day':
        baseDays = 0;
        break;
      case 'international':
        baseDays = 7;
        break;
      default:
        baseDays = 3; // Default to standard shipping
    }
    
    // Add location-based adjustment
    // This is a simplified example - in a real system, you might have a database of pincode-specific delivery times
    const firstDigit = parseInt(pincode.charAt(0));
    
    // Remote areas (example logic)
    if ([1, 2, 3, 9].includes(firstDigit)) {
      baseDays += 2; // Add extra days for remote areas
    }
    
    // Weekend adjustment - don't count weekends in delivery time
    const today = new Date();
    
    // Add business days
    let businessDaysToAdd = baseDays;
    let currentDate = new Date(today);
    
    while (businessDaysToAdd > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysToAdd--;
      }
    }
    
    // Calculate actual calendar days between today and the delivery date
    const actualDays = Math.ceil((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      days: actualDays,
      estimatedDeliveryDate: currentDate
    };
  } catch (error) {
    logger.error({
      msg: 'Error calculating ETA',
      pincode,
      methodCode,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return a fallback ETA
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 5);
    
    return {
      days: 5,
      estimatedDeliveryDate: fallbackDate
    };
  }
} 
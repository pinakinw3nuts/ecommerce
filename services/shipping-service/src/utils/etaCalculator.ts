import { logger } from '@utils/logger';

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
  ECONOMY = 'economy',
  SAME_DAY = 'same_day',
  INTERNATIONAL = 'international'
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
  [ShippingMethod.ECONOMY]: 5,
  [ShippingMethod.SAME_DAY]: 0,
  [ShippingMethod.INTERNATIONAL]: 7
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
    let baseDays = 3; // Default to standard shipping
    
    // Convert methodCode to ShippingMethod enum if possible
    const method = Object.values(ShippingMethod).find(m => m === methodCode);
    
    if (method && method in baseDeliveryTimes) {
      baseDays = baseDeliveryTimes[method as ShippingMethod];
    }
    
    // Add location-based adjustment using zone determination
    const zone = determineZone(pincode);
    baseDays += zoneDeliveryAddition[zone];
    
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
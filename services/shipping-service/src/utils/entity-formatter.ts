import { ShippingMethod } from '../entities/ShippingMethod';
import { ShippingZone } from '../entities/ShippingZone';
import { ShippingRate } from '../entities/ShippingRate';

/**
 * Convert a ShippingMethod entity to a plain object
 */
export function shippingMethodToPlainObject(method: ShippingMethod) {
  return {
    id: method.id,
    name: method.name,
    code: method.code,
    description: method.description,
    baseRate: method.baseRate,
    estimatedDays: method.estimatedDays,
    icon: method.icon,
    isActive: method.isActive,
    displayOrder: method.displayOrder,
    settings: method.settings,
    createdAt: method.createdAt,
    updatedAt: method.updatedAt
  };
}

/**
 * Convert a ShippingZone entity to a plain object
 */
export function shippingZoneToPlainObject(zone: ShippingZone) {
  if (!zone) return null;

  return {
    id: zone.id,
    name: zone.name,
    code: zone.code,
    description: zone.description,
    countries: zone.countries,
    regions: zone.regions,
    pincodePatterns: zone.pincodePatterns,
    pincodeRanges: zone.pincodeRanges,
    excludedPincodes: zone.excludedPincodes,
    isActive: zone.isActive,
    priority: zone.priority,
    createdAt: zone.createdAt instanceof Date ? zone.createdAt.toISOString() : zone.createdAt,
    updatedAt: zone.updatedAt instanceof Date ? zone.updatedAt.toISOString() : zone.updatedAt,
    // Include basic info from relations but avoid circular references
    rates: Array.isArray(zone.rates) ? zone.rates.map(rate => ({
      id: rate.id,
      name: rate.name,
      rate: rate.rate,
      isActive: rate.isActive
    })) : [],
    methods: Array.isArray(zone.methods) ? zone.methods.map(method => ({
      id: method.id,
      name: method.name,
      code: method.code,
      isActive: method.isActive
    })) : []
  };
}

/**
 * Convert a ShippingRate entity to a plain object
 */
export function shippingRateToPlainObject(rate: ShippingRate) {
  return {
    id: rate.id,
    name: rate.name,
    rate: rate.rate,
    shippingMethodId: rate.shippingMethodId,
    shippingZoneId: rate.shippingZoneId,
    minWeight: rate.minWeight,
    maxWeight: rate.maxWeight,
    minOrderValue: rate.minOrderValue,
    maxOrderValue: rate.maxOrderValue,
    estimatedDays: rate.estimatedDays,
    conditions: rate.conditions,
    isActive: rate.isActive,
    createdAt: rate.createdAt,
    updatedAt: rate.updatedAt,
    // Include basic info from relations but avoid circular references
    shippingMethod: rate.shippingMethod ? {
      id: rate.shippingMethod.id,
      name: rate.shippingMethod.name,
      code: rate.shippingMethod.code
    } : null,
    shippingZone: rate.shippingZone ? {
      id: rate.shippingZone.id,
      name: rate.shippingZone.name,
      code: rate.shippingZone.code
    } : null
  };
}

/**
 * Generic function to convert any entity to a plain object
 * Useful for arrays of mixed entity types or when entity type is not known
 */
export function entityToPlainObject<T>(entity: T): Record<string, any> | null {
  if (!entity) return null;
  
  // Convert Date objects to ISO strings for consistent serialization
  const replacer = (key: string, value: any) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  // Use JSON stringify/parse to remove circular references and functions
  return JSON.parse(JSON.stringify(entity, replacer));
} 
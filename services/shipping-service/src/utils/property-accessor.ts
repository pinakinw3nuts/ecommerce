/**
 * Safely get a property value from an object, handling nulls, undefined, and
 * special TypeORM data types like numeric/decimal values
 * @param obj The object to get property from
 * @param prop The property name
 * @returns The property value or null if not found or invalid
 */
export function getSafeProp<T extends object, K extends keyof T>(obj: T, prop: K): any {
  if (!obj) return null;
  
  try {
    const value = obj[prop];
    
    // Handle Date objects 
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return null;
      }
      return value.toISOString();
    }
    
    // Convert numeric values which might be strings/objects from DB to Number
    if (typeof value === 'object' && value !== null && 'toString' in value) {
      const numVal = parseFloat(value.toString());
      if (!isNaN(numVal)) return numVal;
    }
    
    return value === undefined ? null : value;
  } catch (e) {
    console.error(`Error accessing property ${String(prop)} on object:`, e);
    return null;
  }
}

/**
 * Create a safe plain object from a TypeORM entity
 * @param entity The entity to convert
 * @returns A plain object with all properties safely accessed
 */
export function entityToPlain<T extends object>(entity: T): Record<string, any> {
  if (!entity) return {};
  
  const result: Record<string, any> = {};

  // Skip if not an object or is null
  if (typeof entity !== 'object' || entity === null) {
    return {};
  }
  
  try {
    // First try the classic approach - get all own properties
    const props = Object.getOwnPropertyNames(entity);
    
    for (const prop of props) {
      // Skip functions and symbol properties and internal TypeORM properties
      if (prop.startsWith('__')) continue; 
      if (typeof (entity as any)[prop] === 'function') continue;
      if (typeof prop === 'symbol') continue;
      
      // Add property to result with safe access
      result[prop] = getSafeProp(entity, prop as keyof T);
    }
    
    // Try special handling for TypeORM entities - they often have getters that
    // aren't picked up by Object.getOwnPropertyNames
    if (props.length === 0 || (props.length === 1 && props[0] === 'toString')) {
      console.log('Using prototype capture for entity properties');
      // This might be a TypeORM proxy object
      // Get all properties from prototype
      const proto = Object.getPrototypeOf(entity);
      if (proto) {
        // Get all property descriptors 
        const descriptors = Object.getOwnPropertyDescriptors(proto);
        for (const [key, descriptor] of Object.entries(descriptors)) {
          // Skip non-getter properties and functions
          if (!descriptor.get || key.startsWith('__') || typeof (entity as any)[key] === 'function') {
            continue;
          }
          
          try {
            // Try to access getter
            result[key] = getSafeProp(entity, key as keyof T);
          } catch (err) {
            console.log(`Error accessing getter ${key}`, err);
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in entityToPlain:', error);
    // Return empty object in case of error
    return {};
  }
} 
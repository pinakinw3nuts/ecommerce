/**
 * Utility functions for generating and managing SKUs (Stock Keeping Units)
 */

import { createHash } from 'crypto';

/**
 * Generate a SKU from product ID and variant ID
 * Format: P{product-hash}-V{variant-hash}
 */
export function generateSku(productId: string, variantId?: string): string {
  // Create hash from product ID (first 6 chars)
  const productHash = createHash('md5')
    .update(productId)
    .digest('hex')
    .substring(0, 6)
    .toUpperCase();
  
  // If variant ID is provided, create a variant hash
  if (variantId) {
    const variantHash = createHash('md5')
      .update(variantId)
      .digest('hex')
      .substring(0, 4)
      .toUpperCase();
    
    return `P${productHash}-V${variantHash}`;
  }
  
  // If no variant, just use product hash
  return `P${productHash}`;
}

/**
 * Validate a SKU format
 * Valid formats:
 * - P{6 hex chars}
 * - P{6 hex chars}-V{4 hex chars}
 */
export function validateSku(sku: string): boolean {
  // Check if SKU is a string and not empty
  if (typeof sku !== 'string' || sku.trim() === '') {
    return false;
  }
  
  // Check format with regex
  // Format 1: P{6 hex chars}
  // Format 2: P{6 hex chars}-V{4 hex chars}
  const skuRegex = /^P[A-F0-9]{6}(-V[A-F0-9]{4})?$/;
  return skuRegex.test(sku);
}

/**
 * Extract product hash from SKU
 */
export function extractProductHashFromSku(sku: string): string | null {
  if (!validateSku(sku)) {
    return null;
  }
  
  return sku.substring(1, 7);
}

/**
 * Extract variant hash from SKU
 */
export function extractVariantHashFromSku(sku: string): string | null {
  if (!validateSku(sku)) {
    return null;
  }
  
  const parts = sku.split('-V');
  if (parts.length !== 2) {
    return null;
  }
  
  // Return null instead of undefined if parts[1] doesn't exist
  return parts[1] || null;
}

/**
 * Check if SKU has a variant
 */
export function skuHasVariant(sku: string): boolean {
  if (!validateSku(sku)) {
    return false;
  }
  
  return sku.includes('-V');
} 
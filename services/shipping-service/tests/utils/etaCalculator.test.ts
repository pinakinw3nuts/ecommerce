import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateETA, ShippingMethod } from '@utils/etaCalculator';

describe('ETA Calculator', () => {
  // Mock the Date object to have consistent test results
  beforeEach(() => {
    // Mock date to be Monday, January 1, 2024
    const mockDate = new Date(2024, 0, 1, 12, 0, 0); // Monday
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate ETA for standard shipping', () => {
    const result = calculateETA('400001', ShippingMethod.STANDARD);
    
    // Standard shipping is 3 days base + zone adjustment
    expect(result).toBeDefined();
    expect(result.days).toBeGreaterThanOrEqual(3);
    expect(result.estimatedDeliveryDate).toBeInstanceOf(Date);
  });

  it('should calculate ETA for express shipping', () => {
    const result = calculateETA('400001', ShippingMethod.EXPRESS);
    
    // Express shipping is 2 days base + zone adjustment
    expect(result).toBeDefined();
    expect(result.days).toBeGreaterThanOrEqual(2);
    expect(result.estimatedDeliveryDate).toBeInstanceOf(Date);
  });

  it('should calculate ETA for overnight shipping', () => {
    const result = calculateETA('400001', ShippingMethod.OVERNIGHT);
    
    // Overnight shipping is 1 day base + zone adjustment
    expect(result).toBeDefined();
    expect(result.days).toBeGreaterThanOrEqual(1);
    expect(result.estimatedDeliveryDate).toBeInstanceOf(Date);
  });

  it('should calculate ETA for economy shipping', () => {
    const result = calculateETA('400001', ShippingMethod.ECONOMY);
    
    // Economy shipping is 5 days base + zone adjustment
    expect(result).toBeDefined();
    expect(result.days).toBeGreaterThanOrEqual(5);
    expect(result.estimatedDeliveryDate).toBeInstanceOf(Date);
  });

  it('should calculate ETA for same-day shipping', () => {
    const result = calculateETA('400001', ShippingMethod.SAME_DAY);
    
    // Same-day shipping is 0 days base + zone adjustment
    expect(result).toBeDefined();
    expect(result.days).toBeGreaterThanOrEqual(0);
    expect(result.estimatedDeliveryDate).toBeInstanceOf(Date);
  });

  it('should calculate ETA for international shipping', () => {
    const result = calculateETA('400001', ShippingMethod.INTERNATIONAL);
    
    // International shipping is 7 days base + zone adjustment
    expect(result).toBeDefined();
    expect(result.days).toBeGreaterThanOrEqual(7);
    expect(result.estimatedDeliveryDate).toBeInstanceOf(Date);
  });

  it('should adjust ETA based on zone determination', () => {
    // Zone A (pincode starting with 1)
    const zoneAResult = calculateETA('100001', ShippingMethod.STANDARD);
    
    // Zone B (pincode starting with 3)
    const zoneBResult = calculateETA('300001', ShippingMethod.STANDARD);
    
    // Zone C (pincode starting with 7)
    const zoneCResult = calculateETA('700001', ShippingMethod.STANDARD);
    
    // Zone D (pincode starting with 9)
    const zoneDResult = calculateETA('900001', ShippingMethod.STANDARD);
    
    // Each zone adds more days, so Zone D should have more days than Zone A
    expect(zoneDResult.days).toBeGreaterThan(zoneCResult.days);
    expect(zoneCResult.days).toBeGreaterThan(zoneBResult.days);
    expect(zoneBResult.days).toBeGreaterThan(zoneAResult.days);
  });

  it('should skip weekends when calculating delivery date', () => {
    // Set date to Friday, January 5, 2024
    const mockFriday = new Date(2024, 0, 5, 12, 0, 0);
    vi.setSystemTime(mockFriday);
    
    // Standard shipping (3 days) from Friday should be Wednesday (not Monday)
    // because it skips Saturday and Sunday
    const result = calculateETA('100001', ShippingMethod.STANDARD);
    
    // 3 business days from Friday is Wednesday (5 calendar days)
    expect(result.estimatedDeliveryDate.getDay()).not.toBe(0); // Not Sunday
    expect(result.estimatedDeliveryDate.getDay()).not.toBe(6); // Not Saturday
    
    // The actual days should be at least 5 (Friday to Wednesday)
    expect(result.days).toBeGreaterThanOrEqual(5);
  });

  it('should handle invalid inputs gracefully', () => {
    // Invalid pincode
    const result1 = calculateETA('', ShippingMethod.STANDARD);
    expect(result1).toBeDefined();
    expect(result1.days).toBe(5); // Default fallback
    
    // Invalid method code
    const result2 = calculateETA('400001', 'invalid_method' as ShippingMethod);
    expect(result2).toBeDefined();
    expect(result2.days).toBe(3); // Default to standard
  });
}); 
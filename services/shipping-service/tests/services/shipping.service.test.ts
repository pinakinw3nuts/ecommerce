import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShippingService } from '@services/shipping.service';
import { ShippingMethod } from '@entities/ShippingMethod';
import { ShippingZone } from '@entities/ShippingZone';
import { ShippingRate } from '@entities/ShippingRate';
import { AppDataSource } from '@config/dataSource';
import { calculateETA } from '@utils/etaCalculator';

// Mock the etaCalculator
vi.mock('@utils/etaCalculator', () => ({
  calculateETA: vi.fn().mockReturnValue({
    days: 3,
    estimatedDeliveryDate: new Date()
  }),
  ShippingMethod: {
    STANDARD: 'standard',
    EXPRESS: 'express',
    OVERNIGHT: 'overnight',
    ECONOMY: 'economy',
    SAME_DAY: 'same_day',
    INTERNATIONAL: 'international'
  }
}));

describe('ShippingService', () => {
  let shippingService: ShippingService;
  
  // Mock data
  const mockShippingMethod: Partial<ShippingMethod> = {
    id: 'method-1',
    name: 'Standard Shipping',
    code: 'standard',
    description: 'Standard shipping option',
    baseRate: 5.99,
    estimatedDays: 3,
    isActive: true
  };
  
  const mockShippingZone: Partial<ShippingZone> = {
    id: 'zone-1',
    name: 'Domestic',
    priority: 1,
    isActive: true,
    pincodePatterns: ['^400\\d{3}$'],
    pincodeRanges: ['400001-400099'],
    excludedPincodes: ['400050']
  };
  
  const mockShippingRate: Partial<ShippingRate> = {
    id: 'rate-1',
    name: 'Standard Rate',
    rate: 5.99,
    shippingMethodId: 'method-1',
    shippingZoneId: 'zone-1',
    minWeight: 0,
    maxWeight: 5,
    minOrderValue: 0,
    maxOrderValue: null,
    isActive: true
  };
  
  // Mock repositories
  const mockMethodRepository = {
    find: vi.fn(),
    findOne: vi.fn()
  };
  
  const mockZoneRepository = {
    find: vi.fn()
  };
  
  const mockRateRepository = {
    find: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock repositories
    vi.mocked(AppDataSource.getRepository).mockImplementation((entity) => {
      if (entity === ShippingMethod) return mockMethodRepository as any;
      if (entity === ShippingZone) return mockZoneRepository as any;
      if (entity === ShippingRate) return mockRateRepository as any;
      return {} as any;
    });
    
    // Create service instance
    shippingService = new ShippingService();
    
    // Default mock implementations
    mockMethodRepository.find.mockResolvedValue([mockShippingMethod]);
    mockMethodRepository.findOne.mockResolvedValue(mockShippingMethod);
    mockZoneRepository.find.mockResolvedValue([mockShippingZone]);
    mockRateRepository.find.mockResolvedValue([mockShippingRate]);
  });
  
  describe('listShippingMethods', () => {
    it('should list all active shipping methods', async () => {
      const methods = await shippingService.listShippingMethods();
      
      expect(methods).toEqual([mockShippingMethod]);
      expect(mockMethodRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { estimatedDays: 'ASC' }
      });
    });
    
    it('should handle errors', async () => {
      mockMethodRepository.find.mockRejectedValue(new Error('Database error'));
      
      await expect(shippingService.listShippingMethods()).rejects.toThrow('Failed to list shipping methods');
    });
  });
  
  describe('getShippingMethod', () => {
    it('should get a shipping method by ID', async () => {
      const method = await shippingService.getShippingMethod('method-1');
      
      expect(method).toEqual(mockShippingMethod);
      expect(mockMethodRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'method-1', isActive: true }
      });
    });
    
    it('should return null if method not found', async () => {
      mockMethodRepository.findOne.mockResolvedValue(null);
      
      const method = await shippingService.getShippingMethod('non-existent-id');
      
      expect(method).toBeNull();
    });
    
    it('should handle errors', async () => {
      mockMethodRepository.findOne.mockRejectedValue(new Error('Database error'));
      
      await expect(shippingService.getShippingMethod('method-1')).rejects.toThrow('Failed to get shipping method');
    });
  });
  
  describe('getShippingMethodByCode', () => {
    it('should get a shipping method by code', async () => {
      const method = await shippingService.getShippingMethodByCode('standard');
      
      expect(method).toEqual(mockShippingMethod);
      expect(mockMethodRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'standard', isActive: true }
      });
    });
    
    it('should handle errors', async () => {
      mockMethodRepository.findOne.mockRejectedValue(new Error('Database error'));
      
      await expect(shippingService.getShippingMethodByCode('standard')).rejects.toThrow('Failed to get shipping method');
    });
  });
  
  describe('getAvailableShippingMethods', () => {
    it('should return available shipping methods for a pincode', async () => {
      const methods = await shippingService.getAvailableShippingMethods('400001');
      
      expect(methods).toHaveLength(1);
      expect(methods[0]).toHaveProperty('eta');
      expect(calculateETA).toHaveBeenCalled();
    });
    
    it('should return empty array if no zones found for pincode', async () => {
      mockZoneRepository.find.mockResolvedValue([]);
      
      const methods = await shippingService.getAvailableShippingMethods('999999');
      
      expect(methods).toEqual([]);
    });
    
    it('should filter methods based on options', async () => {
      const options = {
        weight: 2,
        orderValue: 50,
        productCategories: ['electronics'],
        customerGroup: 'premium'
      };
      
      await shippingService.getAvailableShippingMethods('400001', options);
      
      // The service should have called findBestRate with the options
      expect(mockRateRepository.find).toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      mockZoneRepository.find.mockRejectedValue(new Error('Database error'));
      
      await expect(shippingService.getAvailableShippingMethods('400001')).rejects.toThrow('Failed to get available shipping methods');
    });
  });
  
  describe('calculateShipping', () => {
    it('should calculate shipping details for a method and pincode', async () => {
      const result = await shippingService.calculateShipping('method-1', '400001');
      
      expect(result).toHaveProperty('id', 'method-1');
      expect(result).toHaveProperty('eta');
      expect(calculateETA).toHaveBeenCalled();
    });
    
    it('should throw error if method not found', async () => {
      mockMethodRepository.findOne.mockResolvedValue(null);
      
      await expect(shippingService.calculateShipping('non-existent-id', '400001')).rejects.toThrow('Shipping method not found or not active');
    });
    
    it('should throw error if no zones found for pincode', async () => {
      mockZoneRepository.find.mockResolvedValue([]);
      
      await expect(shippingService.calculateShipping('method-1', '999999')).rejects.toThrow('Shipping not available for this location');
    });
    
    it('should use best rate if available', async () => {
      const specialRate = { ...mockShippingRate, rate: 3.99 };
      mockRateRepository.find.mockResolvedValue([specialRate]);
      
      const result = await shippingService.calculateShipping('method-1', '400001');
      
      expect(result).toHaveProperty('baseRate', 3.99);
    });
    
    it('should use base rate if no applicable rates found', async () => {
      mockRateRepository.find.mockResolvedValue([]);
      
      const result = await shippingService.calculateShipping('method-1', '400001');
      
      expect(result).toHaveProperty('baseRate', 5.99);
    });
  });
}); 
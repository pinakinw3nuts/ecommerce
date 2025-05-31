import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/dataSource';
import { ShippingMethod } from '../entities/ShippingMethod';
import { ShippingZone } from '../entities/ShippingZone';
import { ShippingRate } from '../entities/ShippingRate';
import { calculateETA, ETAResult } from '../utils/eta';
import { logger } from '../utils/logger';

// Define ShippingMethodWithETA type
interface ShippingMethodWithETA extends ShippingMethod {
  eta: ETAResult;
  rate: number;
}

interface ShippingOptions {
  weight?: number;
  orderValue?: number;
  productCategories?: string[];
  customerGroup?: string;
}

export class ShippingService {
  private shippingMethodRepository: Repository<ShippingMethod>;
  private shippingZoneRepository: Repository<ShippingZone>;
  private shippingRateRepository: Repository<ShippingRate>;

  constructor() {
    this.shippingMethodRepository = AppDataSource.getRepository(ShippingMethod);
    this.shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    this.shippingRateRepository = AppDataSource.getRepository(ShippingRate);
  }

  /**
   * List all active shipping methods
   */
  async listShippingMethods(): Promise<ShippingMethod[]> {
    try {
      return await this.shippingMethodRepository.find({
        where: { isActive: true },
        order: { estimatedDays: 'ASC' }
      });
    } catch (error) {
      logger.error('Error listing shipping methods', error);
      throw new Error('Failed to list shipping methods');
    }
  }

  /**
   * Get a shipping method by ID
   */
  async getShippingMethod(id: string): Promise<ShippingMethod | null> {
    try {
      return await this.shippingMethodRepository.findOne({
        where: { id, isActive: true }
      });
    } catch (error) {
      logger.error(`Error getting shipping method with ID ${id}`, error);
      throw new Error('Failed to get shipping method');
    }
  }

  /**
   * Get a shipping method by code
   */
  async getShippingMethodByCode(code: string): Promise<ShippingMethod | null> {
    try {
      return await this.shippingMethodRepository.findOne({
        where: { code, isActive: true }
      });
    } catch (error) {
      logger.error(`Error getting shipping method with code ${code}`, error);
      throw new Error('Failed to get shipping method');
    }
  }

  /**
   * Get available shipping methods for a location
   */
  async getAvailableShippingMethods(
    pincode: string,
    options: ShippingOptions = {}
  ): Promise<ShippingMethodWithETA[]> {
    try {
      // Get all active shipping methods
      const methods = await this.listShippingMethods();
      
      // Get applicable zones for this pincode
      const zones = await this.findApplicableShippingZones(pincode);
      
      if (zones.length === 0) {
        logger.warn(`No shipping zones found for pincode ${pincode}`);
        return [];
      }
      
      const zoneIds = zones.map(zone => zone.id);
      const result: ShippingMethodWithETA[] = [];
      
      // For each method, find the best rate and calculate ETA
      for (const method of methods) {
        try {
          const { weight, orderValue, productCategories, customerGroup } = options;
          
          // Find the best rate for this method in the applicable zones
          const rate = await this.findBestRate(
            method.id,
            zoneIds,
            weight,
            orderValue,
            productCategories,
            customerGroup
          );
          
          // If no applicable rate found, skip this method
          if (!rate) continue;
          
          // Calculate ETA
          const eta = calculateETA(pincode, method.code);
          
          // Add to results
          result.push({
            ...method,
            rate: rate.rate,
            eta
          });
        } catch (error) {
          logger.error(`Error processing method ${method.id} for pincode ${pincode}`, error);
          // Skip this method and continue with others
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting available shipping methods for pincode ${pincode}`, error);
      throw new Error('Failed to get available shipping methods');
    }
  }

  /**
   * Calculate shipping details for a specific method and location
   */
  async calculateShipping(
    methodId: string,
    pincode: string,
    options: ShippingOptions = {}
  ): Promise<{
    id: string;
    name: string;
    code: string;
    description: string;
    baseRate: number;
    estimatedDays: number;
    eta: { days: number; estimatedDeliveryDate: Date };
  }> {
    try {
      // Get the shipping method
      const method = await this.getShippingMethod(methodId);
      
      if (!method) {
        throw new Error('Shipping method not found or not active');
      }
      
      // Get applicable zones for this pincode
      const zones = await this.findApplicableShippingZones(pincode);
      
      if (zones.length === 0) {
        throw new Error('Shipping not available for this location');
      }
      
      const zoneIds = zones.map(zone => zone.id);
      const { weight, orderValue, productCategories, customerGroup } = options;
      
      // Find the best rate for this method in the applicable zones
      const rate = await this.findBestRate(
        methodId,
        zoneIds,
        weight,
        orderValue,
        productCategories,
        customerGroup
      );
      
      // Calculate ETA
      const eta = calculateETA(pincode, method.code);
      
      return {
        id: method.id,
        name: method.name,
        code: method.code,
        description: method.description || '',
        baseRate: rate?.rate || method.baseRate,
        estimatedDays: method.estimatedDays,
        eta
      };
    } catch (error) {
      logger.error(`Error calculating shipping for method ${methodId} and pincode ${pincode}`, error);
      throw error;
    }
  }

  /**
   * Find shipping zones applicable for a pincode
   */
  private async findApplicableShippingZones(pincode: string): Promise<ShippingZone[]> {
    // Get all active zones
    const zones = await this.shippingZoneRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC' }
    });

    // Filter zones that apply to this pincode
    return zones.filter((zone: ShippingZone) => {
      // Check if pincode is excluded
      if (zone.excludedPincodes && zone.excludedPincodes.includes(pincode)) {
        return false;
      }

      // Check if pincode is directly included in regions
      if (zone.regions) {
        for (const region of zone.regions) {
          if (region.pincode === pincode) {
            return true;
          }
        }
      }

      // Check if pincode matches any pattern
      if (zone.pincodePatterns) {
        for (const pattern of zone.pincodePatterns) {
          if (new RegExp(pattern).test(pincode)) {
            return true;
          }
        }
      }

      // Check if pincode falls within any range
      if (zone.pincodeRanges) {
        for (const range of zone.pincodeRanges) {
          const [start, end] = range.split('-');
          if (pincode >= start && pincode <= end) {
            return true;
          }
        }
      }

      return false;
    });
  }

  /**
   * Find the best shipping rate for a method across multiple zones
   */
  private async findBestRate(
    methodId: string,
    zoneIds: string[],
    weight?: number,
    orderValue?: number,
    productCategories?: string[],
    customerGroup?: string
  ): Promise<ShippingRate | null> {
    // Get all applicable rates
    const rates = await this.shippingRateRepository.find({
      where: {
        shippingMethodId: methodId,
        shippingZoneId: In(zoneIds),
        isActive: true
      }
    });

    // Filter rates based on conditions
    const applicableRates = rates.filter((rate: ShippingRate) => {
      // Check weight constraints
      if (weight !== undefined) {
        if (rate.minWeight !== null && weight < rate.minWeight) return false;
        if (rate.maxWeight !== null && weight > rate.maxWeight) return false;
      }

      // Check order value constraints
      if (orderValue !== undefined) {
        if (rate.minOrderValue !== null && orderValue < rate.minOrderValue) return false;
        if (rate.maxOrderValue !== null && orderValue > rate.maxOrderValue) return false;
      }

      // Check additional conditions
      if (rate.conditions) {
        // Check product categories
        if (rate.conditions.productCategories && productCategories) {
          const hasMatchingCategory = productCategories.some(category => 
            rate.conditions?.productCategories?.includes(category)
          );
          if (!hasMatchingCategory) return false;
        }

        // Check customer group
        if (rate.conditions.customerGroups && customerGroup) {
          if (!rate.conditions.customerGroups.includes(customerGroup)) {
            return false;
          }
        }

        // Check weekday
        if (rate.conditions.weekdays) {
          const currentDay = new Date().getDay();
          if (!rate.conditions.weekdays.includes(currentDay)) {
            return false;
          }
        }
      }

      return true;
    });

    // Return the cheapest applicable rate
    return applicableRates.sort((a: ShippingRate, b: ShippingRate) => a.rate - b.rate)[0] || null;
  }

  /**
   * Get shipping rates for multiple zones
   */
  async getShippingRatesForZones(zoneIds: string[], methodId?: string): Promise<ShippingRate[]> {
    try {
      // Build the where clause
      const whereClause: any = {
        isActive: true
      };

      // Add zone IDs using In operator
      if (zoneIds.length > 0) {
        whereClause.shippingZoneId = In(zoneIds);
      }

      // Add method ID if provided
      if (methodId) {
        whereClause.shippingMethodId = methodId;
      }

      // Query the rates
      const rates = await this.shippingRateRepository.find({
        where: whereClause,
        relations: ['shippingMethod', 'shippingZone']
      });

      return rates;
    } catch (error) {
      logger.error('Error getting shipping rates for zones', error);
      throw new Error('Failed to get shipping rates');
    }
  }

  /**
   * Calculate the final rate based on weight, order value and other factors
   */
  private calculateFinalRate(rates: ShippingRate[], weight?: number, orderValue?: number): number {
    // If no rates, return 0
    if (!rates || rates.length === 0) return 0;

    // Filter rates based on weight and order value
    const applicableRates = rates.filter(rate => {
      if (weight !== undefined) {
        if (rate.minWeight !== null && weight < rate.minWeight) return false;
        if (rate.maxWeight !== null && weight > rate.maxWeight) return false;
      }

      if (orderValue !== undefined) {
        if (rate.minOrderValue !== null && orderValue < rate.minOrderValue) return false;
        if (rate.maxOrderValue !== null && orderValue > rate.maxOrderValue) return false;
      }

      return true;
    });

    // Return the cheapest rate or 0 if no applicable rates
    return applicableRates.length > 0
      ? Math.min(...applicableRates.map(r => r.rate))
      : 0;
  }
} 
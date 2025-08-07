import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ShippingProvider, ProviderType, ProviderStatus } from '../entities/ShippingProvider';
import { ShippingZone, ZoneType } from '../entities/ShippingZone';
import { ShippingRate, RateType } from '../entities/ShippingRate';
import { ShippingMethod, MethodType, MethodStatus } from '../entities/ShippingMethod';
import { Shipment, ShipmentStatus, ShipmentType } from '../entities/Shipment';
import { Tracking, TrackingStatus } from '../entities/Tracking';
import { logger } from '../utils/logger';

export interface ShippingRateRequest {
  origin: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  };
  destination: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  };
  items: {
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    category?: string;
  }[];
  orderValue: number;
  itemCount: number;
  insurance?: boolean;
  signature?: boolean;
}

export interface ShippingRateResponse {
  methodId: string;
  providerId: string;
  methodName: string;
  providerName: string;
  rate: number;
  estimatedDays: number;
  features: {
    tracking: boolean;
    insurance: boolean;
    signature: boolean;
  };
}

export interface CreateShipmentRequest {
  orderId: string;
  providerId: string;
  methodId: string;
  trackingNumber?: string;
  cost: number;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  origin: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };
  destination: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };
  requiresSignature?: boolean;
  hasInsurance?: boolean;
  insuranceAmount?: number;
  packages?: any[];
  metadata?: any;
}

export class ShippingService {
  private providerRepository: Repository<ShippingProvider>;
  private zoneRepository: Repository<ShippingZone>;
  private rateRepository: Repository<ShippingRate>;
  private methodRepository: Repository<ShippingMethod>;
  private shipmentRepository: Repository<Shipment>;
  private trackingRepository: Repository<Tracking>;

  constructor() {
    this.providerRepository = AppDataSource.getRepository(ShippingProvider);
    this.zoneRepository = AppDataSource.getRepository(ShippingZone);
    this.rateRepository = AppDataSource.getRepository(ShippingRate);
    this.methodRepository = AppDataSource.getRepository(ShippingMethod);
    this.shipmentRepository = AppDataSource.getRepository(Shipment);
    this.trackingRepository = AppDataSource.getRepository(Tracking);
  }

  // Provider Management
  async createProvider(data: Partial<ShippingProvider>): Promise<ShippingProvider> {
    try {
      const provider = this.providerRepository.create(data);
      return await this.providerRepository.save(provider);
    } catch (error) {
      logger.error('Error creating shipping provider:', error);
      throw error;
    }
  }

  async getProviders(filters?: {
    type?: ProviderType;
    status?: ProviderStatus;
    isActive?: boolean;
  }): Promise<ShippingProvider[]> {
    try {
      const where: FindOptionsWhere<ShippingProvider> = {};
      
      if (filters?.type) where.type = filters.type;
      if (filters?.status) where.status = filters.status;
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      return await this.providerRepository.find({
        where,
        order: { priority: 'ASC', name: 'ASC' }
      });
    } catch (error) {
      logger.error('Error fetching shipping providers:', error);
      throw error;
    }
  }

  async getProviderById(id: string): Promise<ShippingProvider | null> {
    try {
      return await this.providerRepository.findOne({
        where: { id },
        relations: ['methods']
      });
    } catch (error) {
      logger.error('Error fetching shipping provider:', error);
      throw error;
    }
  }

  // Zone Management
  async createZone(data: Partial<ShippingZone>): Promise<ShippingZone> {
    try {
      const zone = this.zoneRepository.create(data);
      return await this.zoneRepository.save(zone);
    } catch (error) {
      logger.error('Error creating shipping zone:', error);
      throw error;
    }
  }

  async getZones(filters?: {
    type?: ZoneType;
    country?: string;
    isActive?: boolean;
  }): Promise<ShippingZone[]> {
    try {
      const where: FindOptionsWhere<ShippingZone> = {};
      
      if (filters?.type) where.type = filters.type;
      if (filters?.country) where.country = filters.country;
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      return await this.zoneRepository.find({
        where,
        order: { priority: 'ASC', name: 'ASC' }
      });
    } catch (error) {
      logger.error('Error fetching shipping zones:', error);
      throw error;
    }
  }

  async findMatchingZone(location: {
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
  }): Promise<ShippingZone | null> {
    try {
      const zones = await this.zoneRepository.find({
        where: { isActive: true },
        order: { priority: 'ASC' }
      });

      for (const zone of zones) {
        if (zone.matchesLocation(location)) {
          return zone;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error finding matching shipping zone:', error);
      throw error;
    }
  }

  // Rate Management
  async createRate(data: Partial<ShippingRate>): Promise<ShippingRate> {
    try {
      const rate = this.rateRepository.create(data);
      return await this.rateRepository.save(rate);
    } catch (error) {
      logger.error('Error creating shipping rate:', error);
      throw error;
    }
  }

  async getRates(filters?: {
    providerId?: string;
    zoneId?: string;
    methodId?: string;
    isActive?: boolean;
  }): Promise<ShippingRate[]> {
    try {
      const where: FindOptionsWhere<ShippingRate> = {};
      
      if (filters?.providerId) where.providerId = filters.providerId;
      if (filters?.zoneId) where.zoneId = filters.zoneId;
      if (filters?.methodId) where.methodId = filters.methodId;
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      return await this.rateRepository.find({
        where,
        relations: ['provider', 'zone', 'method'],
        order: { priority: 'ASC' }
      });
    } catch (error) {
      logger.error('Error fetching shipping rates:', error);
      throw error;
    }
  }

  // Method Management
  async createMethod(data: Partial<ShippingMethod>): Promise<ShippingMethod> {
    try {
      const method = this.methodRepository.create(data);
      return await this.methodRepository.save(method);
    } catch (error) {
      logger.error('Error creating shipping method:', error);
      throw error;
    }
  }

  async getMethods(filters?: {
    providerId?: string;
    type?: MethodType;
    status?: MethodStatus;
    isActive?: boolean;
  }): Promise<ShippingMethod[]> {
    try {
      const where: FindOptionsWhere<ShippingMethod> = {};
      
      if (filters?.providerId) where.providerId = filters.providerId;
      if (filters?.type) where.type = filters.type;
      if (filters?.status) where.status = filters.status;
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      return await this.methodRepository.find({
        where,
        relations: ['provider'],
        order: { priority: 'ASC', name: 'ASC' }
      });
    } catch (error) {
      logger.error('Error fetching shipping methods:', error);
      throw error;
    }
  }

  // Rate Calculation
  async calculateRates(request: ShippingRateRequest): Promise<ShippingRateResponse[]> {
    try {
      // Find matching zone
      const zone = await this.findMatchingZone(request.destination);
      if (!zone) {
        throw new Error('No shipping zone found for destination');
      }

      // Get all active rates for this zone
      const rates = await this.rateRepository.find({
        where: { zoneId: zone.id, isActive: true },
        relations: ['provider', 'method']
      });

      const responses: ShippingRateResponse[] = [];

      for (const rate of rates) {
        // Check if method is available
        if (!rate.method.isAvailable()) continue;

        // Check if method is available for destination
        if (!rate.method.isAvailableForLocation(request.destination.country)) continue;

        // Calculate total weight
        const totalWeight = request.items.reduce((sum, item) => sum + item.weight, 0);

        // Check if rate is applicable
        const isApplicable = rate.isApplicable({
          weight: totalWeight,
          orderValue: request.orderValue,
          itemCount: request.itemCount,
          categories: request.items.map(item => item.category).filter(Boolean) as string[]
        });

        if (!isApplicable) continue;

        // Calculate rate
        const calculatedRate = rate.calculateRate({
          weight: totalWeight,
          orderValue: request.orderValue,
          itemCount: request.itemCount,
          insurance: request.insurance,
          signature: request.signature
        });

        responses.push({
          methodId: rate.methodId,
          providerId: rate.providerId,
          methodName: rate.method.name,
          providerName: rate.provider.name,
          rate: calculatedRate,
          estimatedDays: rate.estimatedDays,
          features: {
            tracking: rate.method.isTrackable,
            insurance: rate.method.requiresInsurance,
            signature: rate.method.requiresSignature
          }
        });
      }

      // Sort by rate (lowest first)
      return responses.sort((a, b) => a.rate - b.rate);
    } catch (error) {
      logger.error('Error calculating shipping rates:', error);
      throw error;
    }
  }

  // Shipment Management
  async createShipment(data: CreateShipmentRequest): Promise<Shipment> {
    try {
      const shipment = this.shipmentRepository.create({
        ...data,
        status: ShipmentStatus.PENDING
      });
      return await this.shipmentRepository.save(shipment);
    } catch (error) {
      logger.error('Error creating shipment:', error);
      throw error;
    }
  }

  async getShipments(filters?: {
    orderId?: string;
    status?: ShipmentStatus;
    providerId?: string;
  }): Promise<Shipment[]> {
    try {
      const where: FindOptionsWhere<Shipment> = {};
      
      if (filters?.orderId) where.orderId = filters.orderId;
      if (filters?.status) where.status = filters.status;
      if (filters?.providerId) where.providerId = filters.providerId;

      return await this.shipmentRepository.find({
        where,
        relations: ['provider', 'method', 'tracking'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      logger.error('Error fetching shipments:', error);
      throw error;
    }
  }

  async getShipmentById(id: string): Promise<Shipment | null> {
    try {
      return await this.shipmentRepository.findOne({
        where: { id },
        relations: ['provider', 'method', 'tracking', 'order']
      });
    } catch (error) {
      logger.error('Error fetching shipment:', error);
      throw error;
    }
  }

  async updateShipmentStatus(id: string, status: ShipmentStatus): Promise<Shipment> {
    try {
      const shipment = await this.shipmentRepository.findOne({ where: { id } });
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      shipment.updateStatus(status);
      return await this.shipmentRepository.save(shipment);
    } catch (error) {
      logger.error('Error updating shipment status:', error);
      throw error;
    }
  }

  // Tracking Management
  async addTrackingEvent(shipmentId: string, data: {
    trackingNumber: string;
    status: TrackingStatus;
    location: string;
    description: string;
    timestamp: Date;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    signedBy?: string;
    isDelivered?: boolean;
    isException?: boolean;
    exceptionDetails?: any;
    metadata?: any;
  }): Promise<Tracking> {
    try {
      const tracking = this.trackingRepository.create({
        shipmentId,
        ...data
      });
      return await this.trackingRepository.save(tracking);
    } catch (error) {
      logger.error('Error adding tracking event:', error);
      throw error;
    }
  }

  async getTrackingHistory(shipmentId: string): Promise<Tracking[]> {
    try {
      return await this.trackingRepository.find({
        where: { shipmentId },
        order: { timestamp: 'DESC' }
      });
    } catch (error) {
      logger.error('Error fetching tracking history:', error);
      throw error;
    }
  }

  async getTrackingByNumber(trackingNumber: string): Promise<Tracking[]> {
    try {
      return await this.trackingRepository.find({
        where: { trackingNumber },
        relations: ['shipment'],
        order: { timestamp: 'DESC' }
      });
    } catch (error) {
      logger.error('Error fetching tracking by number:', error);
      throw error;
    }
  }

  // Utility Methods
  async getAvailableProviders(): Promise<ShippingProvider[]> {
    try {
      return await this.providerRepository.find({
        where: { isActive: true, status: ProviderStatus.ACTIVE },
        order: { priority: 'ASC', name: 'ASC' }
      });
    } catch (error) {
      logger.error('Error fetching available providers:', error);
      throw error;
    }
  }

  async getAvailableMethods(providerId?: string): Promise<ShippingMethod[]> {
    try {
      const where: FindOptionsWhere<ShippingMethod> = {
        isActive: true,
        status: MethodStatus.ACTIVE
      };
      
      if (providerId) where.providerId = providerId;

      return await this.methodRepository.find({
        where,
        relations: ['provider'],
        order: { priority: 'ASC', name: 'ASC' }
      });
    } catch (error) {
      logger.error('Error fetching available methods:', error);
      throw error;
    }
  }
} 
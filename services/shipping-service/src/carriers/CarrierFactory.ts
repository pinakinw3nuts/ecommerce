import { ICarrierService } from './ICarrierService';
import { FedExService } from './FedExService';
import { UPSService } from './UPSService';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Carrier factory for creating and managing carrier service instances
 */
export class CarrierFactory {
  private static instance: CarrierFactory;
  private carriers: Map<string, ICarrierService> = new Map();
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.initializeCarriers();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CarrierFactory {
    if (!CarrierFactory.instance) {
      CarrierFactory.instance = new CarrierFactory();
    }
    
    return CarrierFactory.instance;
  }
  
  /**
   * Initialize carrier services based on environment configuration
   */
  private initializeCarriers(): void {
    try {
      // Initialize FedEx if configured
      if (env.FEDEX_CLIENT_ID && env.FEDEX_CLIENT_SECRET) {
        const fedex = new FedExService({
          clientId: env.FEDEX_CLIENT_ID,
          clientSecret: env.FEDEX_CLIENT_SECRET,
          accountNumber: env.FEDEX_ACCOUNT_NUMBER || '',
          meterNumber: env.FEDEX_METER_NUMBER || '',
          environment: env.NODE_ENV === 'production' ? 'production' : 'test'
        });
        
        this.carriers.set(fedex.getCarrierId(), fedex);
        logger.info(`Initialized ${fedex.getCarrierName()} carrier service`);
      }
      
      // Initialize UPS if configured
      if (env.UPS_CLIENT_ID && env.UPS_CLIENT_SECRET) {
        const ups = new UPSService({
          clientId: env.UPS_CLIENT_ID,
          clientSecret: env.UPS_CLIENT_SECRET,
          accountNumber: env.UPS_ACCOUNT_NUMBER || '',
          environment: env.NODE_ENV === 'production' ? 'production' : 'test'
        });
        
        this.carriers.set(ups.getCarrierId(), ups);
        logger.info(`Initialized ${ups.getCarrierName()} carrier service`);
      }
      
      // Add more carriers here as needed
      
      logger.info(`Initialized ${this.carriers.size} carrier services`);
    } catch (error) {
      logger.error('Error initializing carrier services', error);
    }
  }
  
  /**
   * Get all available carrier services
   */
  public getAllCarriers(): ICarrierService[] {
    return Array.from(this.carriers.values());
  }
  
  /**
   * Get carrier service by ID
   * @param carrierId Carrier ID
   */
  public getCarrier(carrierId: string): ICarrierService | undefined {
    return this.carriers.get(carrierId);
  }
  
  /**
   * Check if carrier service is available
   * @param carrierId Carrier ID
   */
  public hasCarrier(carrierId: string): boolean {
    return this.carriers.has(carrierId);
  }
  
  /**
   * Get carrier IDs
   */
  public getCarrierIds(): string[] {
    return Array.from(this.carriers.keys());
  }
  
  /**
   * Get carrier names with IDs
   */
  public getCarrierOptions(): Array<{ id: string; name: string }> {
    return Array.from(this.carriers.values()).map(carrier => ({
      id: carrier.getCarrierId(),
      name: carrier.getCarrierName()
    }));
  }
} 
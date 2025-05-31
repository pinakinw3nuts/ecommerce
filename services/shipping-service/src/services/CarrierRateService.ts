import { CarrierFactory } from '../carriers/CarrierFactory';
import { RateRequest, RateResponse, TrackingRequest, TrackingResponse } from '../carriers/ICarrierService';
import { logger } from '../utils/logger';

/**
 * Service for comparing shipping rates across carriers
 */
export class CarrierRateService {
  private carrierFactory: CarrierFactory;
  
  /**
   * Constructor
   */
  constructor() {
    this.carrierFactory = CarrierFactory.getInstance();
  }
  
  /**
   * Get rates from all available carriers
   * @param request Rate request parameters
   */
  async getAllCarrierRates(request: RateRequest): Promise<{
    rates: RateResponse[];
    errors: Record<string, string>;
  }> {
    const carriers = this.carrierFactory.getAllCarriers();
    const rates: RateResponse[] = [];
    const errors: Record<string, string> = {};
    
    // Get rates from each carrier in parallel
    const ratePromises = carriers.map(async (carrier) => {
      try {
        const carrierRates = await carrier.getRates(request);
        rates.push(...carrierRates);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error getting rates from ${carrier.getCarrierName()}`, error);
        errors[carrier.getCarrierId()] = errorMessage;
      }
    });
    
    await Promise.all(ratePromises);
    
    // Sort rates by price
    rates.sort((a, b) => a.totalAmount - b.totalAmount);
    
    return { rates, errors };
  }
  
  /**
   * Get rates from specific carriers
   * @param request Rate request parameters
   * @param carrierIds List of carrier IDs to get rates from
   */
  async getCarrierRates(
    request: RateRequest,
    carrierIds: string[]
  ): Promise<{
    rates: RateResponse[];
    errors: Record<string, string>;
  }> {
    const rates: RateResponse[] = [];
    const errors: Record<string, string> = {};
    
    // Get rates from each carrier in parallel
    const ratePromises = carrierIds.map(async (carrierId) => {
      const carrier = this.carrierFactory.getCarrier(carrierId);
      
      if (!carrier) {
        errors[carrierId] = `Carrier ${carrierId} not found`;
        return;
      }
      
      try {
        const carrierRates = await carrier.getRates(request);
        rates.push(...carrierRates);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error getting rates from ${carrier.getCarrierName()}`, error);
        errors[carrierId] = errorMessage;
      }
    });
    
    await Promise.all(ratePromises);
    
    // Sort rates by price
    rates.sort((a, b) => a.totalAmount - b.totalAmount);
    
    return { rates, errors };
  }
  
  /**
   * Get best rate from all available carriers
   * @param request Rate request parameters
   * @param criteria Criteria for determining the best rate ('price', 'time', or 'value')
   */
  async getBestRate(
    request: RateRequest,
    criteria: 'price' | 'time' | 'value' = 'price'
  ): Promise<RateResponse | null> {
    const { rates } = await this.getAllCarrierRates(request);
    
    if (rates.length === 0) {
      return null;
    }
    
    // Sort rates based on criteria
    switch (criteria) {
      case 'price':
        // Already sorted by price in getAllCarrierRates
        return rates[0];
        
      case 'time':
        // Sort by delivery time (shortest first)
        return [...rates].sort((a, b) => (a.estimatedDays || 999) - (b.estimatedDays || 999))[0];
        
      case 'value':
        // Sort by a combination of price and time
        // This is a simple algorithm that could be refined based on business needs
        return [...rates].sort((a, b) => {
          const aValue = a.totalAmount * (a.estimatedDays || 5);
          const bValue = b.totalAmount * (b.estimatedDays || 5);
          return aValue - bValue;
        })[0];
        
      default:
        return rates[0];
    }
  }
  
  /**
   * Track shipment across carriers
   * @param trackingNumber Tracking number
   */
  async trackShipment(trackingNumber: string): Promise<TrackingResponse | null> {
    const carriers = this.carrierFactory.getAllCarriers();
    
    // Try each carrier until we find one that can track this shipment
    for (const carrier of carriers) {
      try {
        const tracking = await carrier.trackShipment({
          trackingNumber,
          carrierCode: carrier.getCarrierId()
        });
        
        return tracking;
      } catch (error) {
        // Log error but continue trying other carriers
        logger.debug(`${carrier.getCarrierName()} couldn't track ${trackingNumber}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    logger.error(`No carrier could track shipment ${trackingNumber}`);
    return null;
  }
  
  /**
   * Get available carrier options
   */
  getCarrierOptions(): Array<{ id: string; name: string }> {
    return this.carrierFactory.getCarrierOptions();
  }
} 
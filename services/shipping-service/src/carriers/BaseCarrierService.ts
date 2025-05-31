import { ICarrierService, CarrierAddress, RateRequest, RateResponse, ShipmentRequest, ShipmentResponse, TrackingRequest, TrackingResponse, TrackingStatus } from './ICarrierService';
import { logger } from '../utils/logger';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Base carrier service abstract class
 * Provides common functionality for all carrier integrations
 */
export abstract class BaseCarrierService implements ICarrierService {
  protected apiClient: AxiosInstance;
  protected config: Record<string, any>;
  
  /**
   * Constructor
   * @param baseURL API base URL
   * @param config Carrier-specific configuration
   */
  constructor(baseURL: string, config: Record<string, any>) {
    this.config = config;
    
    // Create axios instance with base configuration
    this.apiClient = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use(
      (config) => this.addAuthHeaders(config),
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => this.handleApiError(error)
    );
  }
  
  /**
   * Add authentication headers to requests
   * Override in carrier-specific implementations
   */
  protected async addAuthHeaders(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    return config;
  }
  
  /**
   * Handle API errors
   * @param error Axios error
   */
  protected async handleApiError(error: any): Promise<never> {
    const carrierId = this.getCarrierId();
    const carrierName = this.getCarrierName();
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error({
        msg: `${carrierName} API error`,
        carrierId,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      throw new Error(`${carrierName} API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      logger.error({
        msg: `${carrierName} API no response`,
        carrierId,
        request: error.request
      });
      
      throw new Error(`${carrierName} API no response: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error({
        msg: `${carrierName} API request error`,
        carrierId,
        error: error.message
      });
      
      throw new Error(`${carrierName} API request error: ${error.message}`);
    }
  }
  
  /**
   * Get carrier ID
   * Must be implemented by carrier-specific classes
   */
  abstract getCarrierId(): string;
  
  /**
   * Get carrier name
   * Must be implemented by carrier-specific classes
   */
  abstract getCarrierName(): string;
  
  /**
   * Get supported service types
   * Must be implemented by carrier-specific classes
   */
  abstract getSupportedServices(): Promise<Array<{code: string, name: string}>>;
  
  /**
   * Get shipping rates
   * Must be implemented by carrier-specific classes
   */
  abstract getRates(request: RateRequest): Promise<RateResponse[]>;
  
  /**
   * Create shipment and generate label
   * Must be implemented by carrier-specific classes
   */
  abstract createShipment(request: ShipmentRequest): Promise<ShipmentResponse>;
  
  /**
   * Track shipment
   * Must be implemented by carrier-specific classes
   */
  abstract trackShipment(request: TrackingRequest): Promise<TrackingResponse>;
  
  /**
   * Validate address
   * Must be implemented by carrier-specific classes
   */
  abstract validateAddress(address: CarrierAddress): Promise<{
    isValid: boolean;
    normalizedAddress?: CarrierAddress;
    messages?: string[];
  }>;
  
  /**
   * Cancel shipment
   * Must be implemented by carrier-specific classes
   */
  abstract cancelShipment(shipmentId: string): Promise<{
    success: boolean;
    message: string;
  }>;
  
  /**
   * Convert weight to carrier's required unit
   * @param weight Weight value
   * @param fromUnit Current unit
   * @param toUnit Target unit
   */
  protected convertWeight(weight: number, fromUnit: 'kg' | 'lb' | 'oz', toUnit: 'kg' | 'lb' | 'oz'): number {
    if (fromUnit === toUnit) {
      return weight;
    }
    
    // Convert to kg first
    let weightInKg: number;
    switch (fromUnit) {
      case 'kg':
        weightInKg = weight;
        break;
      case 'lb':
        weightInKg = weight * 0.45359237;
        break;
      case 'oz':
        weightInKg = weight * 0.0283495;
        break;
    }
    
    // Convert from kg to target unit
    switch (toUnit) {
      case 'kg':
        return weightInKg;
      case 'lb':
        return weightInKg / 0.45359237;
      case 'oz':
        return weightInKg / 0.0283495;
    }
  }
  
  /**
   * Convert dimensions to carrier's required unit
   * @param dimension Dimension value
   * @param fromUnit Current unit
   * @param toUnit Target unit
   */
  protected convertDimension(dimension: number, fromUnit: 'cm' | 'in', toUnit: 'cm' | 'in'): number {
    if (fromUnit === toUnit) {
      return dimension;
    }
    
    return fromUnit === 'cm' ? dimension / 2.54 : dimension * 2.54;
  }
  
  /**
   * Format address for carrier API
   * Override in carrier-specific implementations if needed
   */
  protected formatAddress(address: CarrierAddress): any {
    return {
      name: address.name,
      street1: address.addressLine1,
      street2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      phone: address.phone || '',
      email: address.email || '',
      residential: address.isResidential || false
    };
  }
} 
import { ShippingRate } from '../entities/ShippingRate';

/**
 * Address structure for carrier API requests
 */
export interface CarrierAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  email?: string;
  isResidential?: boolean;
}

/**
 * Package dimensions
 */
export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

/**
 * Package weight
 */
export interface PackageWeight {
  value: number;
  unit: 'kg' | 'lb' | 'oz';
}

/**
 * Package details for shipping rate calculation
 */
export interface PackageDetails {
  weight: PackageWeight;
  dimensions?: PackageDimensions;
  declaredValue?: number;
  description?: string;
  requiresSignature?: boolean;
  isInsured?: boolean;
  insuranceAmount?: number;
}

/**
 * Shipping rate request parameters
 */
export interface RateRequest {
  originAddress: CarrierAddress;
  destinationAddress: CarrierAddress;
  packages: PackageDetails[];
  shipDate?: Date;
  serviceType?: string;
  isReturn?: boolean;
  options?: Record<string, any>;
}

/**
 * Shipping rate response
 */
export interface RateResponse {
  carrierId: string;
  carrierName: string;
  serviceType: string;
  serviceCode: string;
  serviceName: string;
  totalAmount: number;
  currency: string;
  estimatedDays: number;
  estimatedDeliveryDate?: Date;
  rateDetails?: {
    baseRate: number;
    taxes?: number;
    fees?: Record<string, number>;
    discounts?: Record<string, number>;
  };
  carrierSpecificData?: Record<string, any>;
}

/**
 * Shipment details for label creation
 */
export interface ShipmentRequest extends RateRequest {
  rateId?: string;
  serviceCode: string;
  labelFormat?: 'PDF' | 'PNG' | 'ZPL';
  paperSize?: 'A4' | '4x6' | 'LETTER';
  customsInfo?: {
    contentType: 'MERCHANDISE' | 'DOCUMENTS' | 'GIFT' | 'RETURN' | 'SAMPLE';
    customsItems: Array<{
      description: string;
      quantity: number;
      value: number;
      weight: number;
      originCountry: string;
      hsCode?: string;
    }>;
  };
}

/**
 * Shipment response with label and tracking information
 */
export interface ShipmentResponse {
  carrierId: string;
  carrierName: string;
  trackingNumber: string;
  labelUrl: string;
  labelData?: string;
  shipmentId: string;
  totalAmount: number;
  currency: string;
  estimatedDeliveryDate?: Date;
  carrierSpecificData?: Record<string, any>;
}

/**
 * Tracking request
 */
export interface TrackingRequest {
  trackingNumber: string;
  carrierCode: string;
}

/**
 * Tracking status enum
 */
export enum TrackingStatus {
  UNKNOWN = 'UNKNOWN',
  PRE_TRANSIT = 'PRE_TRANSIT',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  AVAILABLE_FOR_PICKUP = 'AVAILABLE_FOR_PICKUP',
  RETURN_TO_SENDER = 'RETURN_TO_SENDER',
  FAILURE = 'FAILURE',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
  EXCEPTION = 'EXCEPTION',
  PICKUP = 'PICKUP',
  MANIFEST = 'MANIFEST'
}

/**
 * Tracking event
 */
export interface TrackingEvent {
  timestamp: Date;
  status: TrackingStatus;
  description: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Tracking response
 */
export interface TrackingResponse {
  trackingNumber: string;
  carrierId: string;
  carrierName: string;
  status: TrackingStatus;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  events: TrackingEvent[];
  carrierSpecificData?: Record<string, any>;
}

/**
 * Carrier service interface
 * All carrier integrations must implement this interface
 */
export interface ICarrierService {
  /**
   * Get carrier ID
   */
  getCarrierId(): string;
  
  /**
   * Get carrier name
   */
  getCarrierName(): string;
  
  /**
   * Get supported service types
   */
  getSupportedServices(): Promise<Array<{code: string, name: string}>>;
  
  /**
   * Get shipping rates
   * @param request Rate request parameters
   */
  getRates(request: RateRequest): Promise<RateResponse[]>;
  
  /**
   * Create shipment and generate label
   * @param request Shipment request parameters
   */
  createShipment(request: ShipmentRequest): Promise<ShipmentResponse>;
  
  /**
   * Track shipment
   * @param request Tracking request parameters
   */
  trackShipment(request: TrackingRequest): Promise<TrackingResponse>;
  
  /**
   * Validate address
   * @param address Address to validate
   */
  validateAddress(address: CarrierAddress): Promise<{
    isValid: boolean;
    normalizedAddress?: CarrierAddress;
    messages?: string[];
  }>;
  
  /**
   * Cancel shipment
   * @param shipmentId Shipment ID to cancel
   */
  cancelShipment(shipmentId: string): Promise<{
    success: boolean;
    message: string;
  }>;
} 
import { BaseCarrierService } from './BaseCarrierService';
import { CarrierAddress, RateRequest, RateResponse, ShipmentRequest, ShipmentResponse, TrackingRequest, TrackingResponse, TrackingStatus, TrackingEvent } from './ICarrierService';
import { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { logger } from '../utils/logger';

/**
 * UPS API configuration
 */
interface UPSConfig {
  clientId: string;
  clientSecret: string;
  accountNumber: string;
  environment: 'production' | 'test';
}

/**
 * UPS authentication response
 */
interface UPSAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * UPS service implementation
 */
export class UPSService extends BaseCarrierService {
  private authToken: string | null = null;
  private authExpiry: number = 0;
  
  /**
   * Constructor
   * @param config UPS API configuration
   */
  constructor(config: UPSConfig) {
    const baseURL = config.environment === 'production'
      ? 'https://onlinetools.ups.com/api'
      : 'https://wwwcie.ups.com/api';
    
    super(baseURL, config);
  }
  
  /**
   * Get carrier ID
   */
  getCarrierId(): string {
    return 'ups';
  }
  
  /**
   * Get carrier name
   */
  getCarrierName(): string {
    return 'UPS';
  }
  
  /**
   * Add authentication headers to requests
   * @param config Axios request config
   */
  protected async addAuthHeaders(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    // Skip auth for token endpoint
    if (config.url?.includes('/security/v1/oauth/token')) {
      return config;
    }
    
    // Get or refresh auth token
    const token = await this.getAuthToken();
    
    // Ensure headers exist
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    
    // Set headers
    config.headers.set('Authorization', `Bearer ${token}`);
    config.headers.set('transId', `trans-${Date.now()}`);
    config.headers.set('transactionSrc', 'shipping-service');
    
    return config;
  }
  
  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    
    // Return existing token if still valid
    if (this.authToken && now < this.authExpiry) {
      return this.authToken;
    }
    
    try {
      const response = await this.apiClient.post<UPSAuthResponse>('/security/v1/oauth/token', {
        grant_type: 'client_credentials'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-merchant-id': this.config.clientId
        },
        auth: {
          username: this.config.clientId,
          password: this.config.clientSecret
        }
      });
      
      this.authToken = response.data.access_token;
      // Set expiry time with 5 minute buffer
      this.authExpiry = now + (response.data.expires_in * 1000) - (5 * 60 * 1000);
      
      return this.authToken;
    } catch (error) {
      logger.error('UPS authentication error', error);
      throw new Error('Failed to authenticate with UPS API');
    }
  }
  
  /**
   * Get supported service types
   */
  async getSupportedServices(): Promise<Array<{code: string, name: string}>> {
    return [
      { code: '01', name: 'UPS Next Day Air' },
      { code: '02', name: 'UPS 2nd Day Air' },
      { code: '03', name: 'UPS Ground' },
      { code: '07', name: 'UPS Worldwide Express' },
      { code: '08', name: 'UPS Worldwide Expedited' },
      { code: '11', name: 'UPS Standard' },
      { code: '12', name: 'UPS 3 Day Select' },
      { code: '13', name: 'UPS Next Day Air Saver' },
      { code: '14', name: 'UPS Next Day Air Early' },
      { code: '54', name: 'UPS Worldwide Express Plus' },
      { code: '59', name: 'UPS 2nd Day Air A.M.' },
      { code: '65', name: 'UPS Saver' }
    ];
  }
  
  /**
   * Get shipping rates
   * @param request Rate request parameters
   */
  async getRates(request: RateRequest): Promise<RateResponse[]> {
    try {
      // Format request for UPS API
      const upsRequest = this.formatRateRequest(request);
      
      // Call UPS rate API
      const response = await this.apiClient.post('/rating/v1/Rate', upsRequest, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Parse and return response
      return this.parseRateResponse(response.data, request);
    } catch (error) {
      logger.error('Error getting UPS rates', error);
      throw new Error(`Failed to get UPS rates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Format rate request for UPS API
   * @param request Rate request
   */
  private formatRateRequest(request: RateRequest): any {
    const { originAddress, destinationAddress, packages, shipDate, serviceType, options } = request;
    
    // Format addresses
    const shipFrom = this.formatUPSAddress(originAddress);
    const shipTo = this.formatUPSAddress(destinationAddress);
    
    // Format packages
    const packageDetails = packages.map((pkg) => {
      const weightUnit = pkg.weight.unit === 'kg' ? 'KGS' : 'LBS';
      
      const packageDetail: any = {
        packaging: {
          code: '02', // Customer packaging
          description: 'Package'
        },
        packageWeight: {
          unitOfMeasurement: {
            code: weightUnit
          },
          weight: pkg.weight.value.toString()
        }
      };
      
      // Add dimensions if provided
      if (pkg.dimensions) {
        const dimensionUnit = pkg.dimensions.unit === 'cm' ? 'CM' : 'IN';
        packageDetail.dimensions = {
          unitOfMeasurement: {
            code: dimensionUnit
          },
          length: pkg.dimensions.length.toString(),
          width: pkg.dimensions.width.toString(),
          height: pkg.dimensions.height.toString()
        };
      }
      
      // Add declared value if provided
      if (pkg.declaredValue) {
        packageDetail.packageServiceOptions = {
          declaredValue: {
            monetaryValue: pkg.declaredValue.toString(),
            currencyCode: 'USD' // Default to USD, could be made configurable
          }
        };
      }
      
      return packageDetail;
    });
    
    // Build request payload
    const payload: any = {
      RateRequest: {
        Request: {
          RequestOption: 'Shop', // Get all available services
          TransactionReference: {
            CustomerContext: 'Rate Request'
          }
        },
        Shipment: {
          Shipper: {
            ShipperNumber: this.config.accountNumber,
            ...shipFrom
          },
          ShipTo: shipTo,
          ShipFrom: shipFrom,
          Service: {
            Code: serviceType || ''
          },
          Package: packageDetails
        }
      }
    };
    
    // Add ship date if provided
    if (shipDate) {
      const formattedDate = shipDate.toISOString().split('T')[0];
      payload.RateRequest.Shipment.DeliveryTimeInformation = {
        PackageBillType: '02', // Document
        Pickup: {
          Date: formattedDate.replace(/-/g, '')
        }
      };
    }
    
    return payload;
  }
  
  /**
   * Parse rate response from UPS API
   * @param response UPS API response
   * @param request Original rate request
   */
  private parseRateResponse(response: any, request: RateRequest): RateResponse[] {
    const results: RateResponse[] = [];
    
    if (!response.RateResponse?.RatedShipment) {
      return results;
    }
    
    // Handle both single service and multiple services response
    const ratedShipments = Array.isArray(response.RateResponse.RatedShipment)
      ? response.RateResponse.RatedShipment
      : [response.RateResponse.RatedShipment];
    
    for (const ratedShipment of ratedShipments) {
      const serviceCode = ratedShipment.Service?.Code;
      const serviceName = this.getServiceNameByCode(serviceCode);
      
      // Get the rate info
      const totalAmount = parseFloat(ratedShipment.TotalCharges?.MonetaryValue || '0');
      const currency = ratedShipment.TotalCharges?.CurrencyCode || 'USD';
      
      // Get delivery time info
      let estimatedDays = 0;
      let estimatedDeliveryDate: Date | undefined;
      
      if (ratedShipment.GuaranteedDelivery?.DeliveryByTime) {
        const deliveryDate = ratedShipment.GuaranteedDelivery.BusinessDaysInTransit;
        estimatedDays = parseInt(deliveryDate, 10) || 0;
        
        // Calculate estimated delivery date
        if (estimatedDays > 0) {
          estimatedDeliveryDate = new Date();
          estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDays);
        }
      }
      
      // Create rate response
      results.push({
        carrierId: this.getCarrierId(),
        carrierName: this.getCarrierName(),
        serviceType: serviceCode,
        serviceCode: serviceCode,
        serviceName: serviceName,
        totalAmount,
        currency,
        estimatedDays,
        estimatedDeliveryDate,
        rateDetails: {
          baseRate: parseFloat(ratedShipment.TransportationCharges?.MonetaryValue || '0'),
          taxes: parseFloat(ratedShipment.TaxCharges?.MonetaryValue || '0'),
          fees: {}
        },
        carrierSpecificData: {
          rateType: ratedShipment.RateType,
          guaranteedDelivery: !!ratedShipment.GuaranteedDelivery
        }
      });
    }
    
    return results;
  }
  
  /**
   * Get service name by code
   * @param code Service code
   */
  private getServiceNameByCode(code: string): string {
    const serviceMap: Record<string, string> = {
      '01': 'UPS Next Day Air',
      '02': 'UPS 2nd Day Air',
      '03': 'UPS Ground',
      '07': 'UPS Worldwide Express',
      '08': 'UPS Worldwide Expedited',
      '11': 'UPS Standard',
      '12': 'UPS 3 Day Select',
      '13': 'UPS Next Day Air Saver',
      '14': 'UPS Next Day Air Early',
      '54': 'UPS Worldwide Express Plus',
      '59': 'UPS 2nd Day Air A.M.',
      '65': 'UPS Saver'
    };
    
    return serviceMap[code] || code;
  }
  
  /**
   * Format address for UPS API
   * @param address Address to format
   */
  private formatUPSAddress(address: CarrierAddress): any {
    return {
      Name: address.name,
      Address: {
        AddressLine: [
          address.addressLine1,
          ...(address.addressLine2 ? [address.addressLine2] : [])
        ],
        City: address.city,
        StateProvinceCode: address.state,
        PostalCode: address.postalCode,
        CountryCode: address.country
      },
      Phone: {
        Number: address.phone || ''
      }
    };
  }
  
  /**
   * Create shipment and generate label
   * @param request Shipment request parameters
   */
  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      // Format request for UPS API
      const upsRequest = this.formatShipmentRequest(request);
      
      // Call UPS shipment API
      const response = await this.apiClient.post('/shipping/v1/ship', upsRequest, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Parse and return response
      return this.parseShipmentResponse(response.data);
    } catch (error) {
      logger.error('Error creating UPS shipment', error);
      throw new Error(`Failed to create UPS shipment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Format shipment request for UPS API
   * @param request Shipment request
   */
  private formatShipmentRequest(request: ShipmentRequest): any {
    // Implementation would be similar to formatRateRequest but with additional
    // label generation parameters and service selection
    // This is a simplified placeholder
    return {
      // UPS shipment request format
    };
  }
  
  /**
   * Parse shipment response from UPS API
   * @param response UPS API response
   */
  private parseShipmentResponse(response: any): ShipmentResponse {
    // This is a simplified placeholder
    const shipmentResults = response.ShipmentResponse?.ShipmentResults;
    
    if (!shipmentResults) {
      throw new Error('Invalid shipment response from UPS');
    }
    
    return {
      carrierId: this.getCarrierId(),
      carrierName: this.getCarrierName(),
      trackingNumber: shipmentResults.ShipmentIdentificationNumber || '',
      labelUrl: '', // UPS doesn't provide a URL, just the raw data
      labelData: shipmentResults.PackageResults?.ShippingLabel?.GraphicImage || '',
      shipmentId: shipmentResults.ShipmentIdentificationNumber || '',
      totalAmount: parseFloat(shipmentResults.ShipmentCharges?.TotalCharges?.MonetaryValue || '0'),
      currency: shipmentResults.ShipmentCharges?.TotalCharges?.CurrencyCode || 'USD',
      estimatedDeliveryDate: undefined, // UPS doesn't provide this in the shipment response
      carrierSpecificData: {
        serviceType: shipmentResults.ServiceCode || '',
        negotiatedRates: !!shipmentResults.NegotiatedRateCharges
      }
    };
  }
  
  /**
   * Track shipment
   * @param request Tracking request parameters
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      // Call UPS tracking API
      const response = await this.apiClient.get(`/track/v1/details/${request.trackingNumber}`, {
        params: {
          locale: 'en_US'
        }
      });
      
      // Parse and return response
      return this.parseTrackingResponse(response.data);
    } catch (error) {
      logger.error('Error tracking UPS shipment', error);
      throw new Error(`Failed to track UPS shipment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Parse tracking response from UPS API
   * @param response UPS API response
   */
  private parseTrackingResponse(response: any): TrackingResponse {
    if (!response.trackResponse?.shipment?.[0]) {
      throw new Error('Invalid tracking response from UPS');
    }
    
    const shipment = response.trackResponse.shipment[0];
    const trackingNumber = shipment.inquiryNumber;
    
    // Map UPS status to our TrackingStatus enum
    const statusMap: Record<string, TrackingStatus> = {
      'I': TrackingStatus.IN_TRANSIT,
      'D': TrackingStatus.DELIVERED,
      'X': TrackingStatus.EXCEPTION,
      'P': TrackingStatus.PICKUP,
      'M': TrackingStatus.MANIFEST
    };
    
    // Get current status
    const status = this.mapUPSStatusToTrackingStatus(shipment.currentStatus?.code);
    
    // Parse events
    const events: TrackingEvent[] = (shipment.activity || []).map((activity: any) => {
      const eventStatus = this.mapUPSStatusToTrackingStatus(activity.status?.code);
      
      // Parse date and time
      let timestamp: Date | undefined;
      if (activity.date && activity.time) {
        const dateStr = activity.date;
        const timeStr = activity.time;
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1; // JS months are 0-indexed
        const day = parseInt(dateStr.substring(6, 8), 10);
        const hour = parseInt(timeStr.substring(0, 2), 10);
        const minute = parseInt(timeStr.substring(2, 4), 10);
        const second = parseInt(timeStr.substring(4, 6), 10);
        
        timestamp = new Date(Date.UTC(year, month, day, hour, minute, second));
      }
      
      return {
        timestamp: timestamp || new Date(),
        status: eventStatus,
        description: activity.status?.description || '',
        location: activity.location?.address?.city 
          ? `${activity.location.address.city}, ${activity.location.address.stateProvince}, ${activity.location.address.country}`
          : undefined,
        coordinates: undefined // UPS doesn't provide coordinates
      };
    });
    
    // Get delivery dates
    let estimatedDeliveryDate: Date | undefined;
    let actualDeliveryDate: Date | undefined;
    
    if (shipment.deliveryDate?.[0]?.date) {
      const dateStr = shipment.deliveryDate[0].date;
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1; // JS months are 0-indexed
      const day = parseInt(dateStr.substring(6, 8), 10);
      
      if (shipment.currentStatus?.code === 'D') {
        // If delivered, use as actual delivery date
        actualDeliveryDate = new Date(Date.UTC(year, month, day));
      } else {
        // Otherwise, use as estimated delivery date
        estimatedDeliveryDate = new Date(Date.UTC(year, month, day));
      }
    }
    
    return {
      trackingNumber,
      carrierId: this.getCarrierId(),
      carrierName: this.getCarrierName(),
      status,
      estimatedDeliveryDate,
      actualDeliveryDate,
      events,
      carrierSpecificData: {
        serviceType: shipment.service?.description,
        packageWeight: shipment.packageWeight?.weight,
        packageWeightUnit: shipment.packageWeight?.unitOfMeasurement?.code
      }
    };
  }
  
  /**
   * Map UPS status code to tracking status
   * @param statusCode UPS status code
   */
  private mapUPSStatusToTrackingStatus(statusCode?: string): TrackingStatus {
    if (!statusCode) {
      return TrackingStatus.UNKNOWN;
    }
    
    const statusMap: Record<string, TrackingStatus> = {
      'D': TrackingStatus.DELIVERED,
      'I': TrackingStatus.IN_TRANSIT,
      'X': TrackingStatus.FAILURE,
      'P': TrackingStatus.PRE_TRANSIT,
      'M': TrackingStatus.PRE_TRANSIT,
      'O': TrackingStatus.OUT_FOR_DELIVERY
    };
    
    return statusMap[statusCode.charAt(0)] || TrackingStatus.UNKNOWN;
  }
  
  /**
   * Validate address
   * @param address Address to validate
   */
  async validateAddress(address: CarrierAddress): Promise<{
    isValid: boolean;
    normalizedAddress?: CarrierAddress;
    messages?: string[];
  }> {
    try {
      // Call UPS address validation API
      const response = await this.apiClient.post('/addressvalidation/v1/1', {
        XAVRequest: {
          AddressKeyFormat: {
            AddressLine: [
              address.addressLine1,
              ...(address.addressLine2 ? [address.addressLine2] : [])
            ],
            PoliticalDivision2: address.city,
            PoliticalDivision1: address.state,
            PostcodePrimaryLow: address.postalCode,
            CountryCode: address.country
          }
        }
      });
      
      // Parse response
      const result = response.data.XAVResponse;
      
      if (!result) {
        return {
          isValid: false,
          messages: ['No address validation result returned']
        };
      }
      
      const isValid = result.ValidAddressIndicator === 'Y';
      const messages: string[] = [];
      
      if (result.NoCandidatesIndicator === 'Y') {
        messages.push('No valid address candidates found');
      }
      
      if (result.AmbiguousAddressIndicator === 'Y') {
        messages.push('Address is ambiguous');
      }
      
      // Extract normalized address if available
      let normalizedAddress: CarrierAddress | undefined;
      
      if (result.Candidate?.[0]) {
        const candidate = result.Candidate[0];
        const addr = candidate.AddressKeyFormat;
        
        normalizedAddress = {
          name: address.name,
          addressLine1: addr.AddressLine[0],
          addressLine2: addr.AddressLine[1] || undefined,
          city: addr.PoliticalDivision2,
          state: addr.PoliticalDivision1,
          country: addr.CountryCode,
          postalCode: addr.PostcodePrimaryLow + (addr.PostcodeExtendedLow ? '-' + addr.PostcodeExtendedLow : ''),
          phone: address.phone,
          email: address.email,
          isResidential: candidate.AddressClassification?.Description === 'Residential'
        };
      }
      
      return {
        isValid,
        normalizedAddress,
        messages
      };
    } catch (error) {
      logger.error('Error validating address with UPS', error);
      throw new Error(`Failed to validate address with UPS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Cancel shipment
   * @param shipmentId Shipment ID to cancel
   */
  async cancelShipment(shipmentId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Call UPS void shipment API
      const response = await this.apiClient.delete(`/shipments/v1/void/cancel/${shipmentId}`, {
        params: {
          shipmentIdentificationNumber: shipmentId
        }
      });
      
      // Check if cancellation was successful
      const success = response.data.VoidShipmentResponse?.Response?.ResponseStatus?.Code === '1';
      const message = response.data.VoidShipmentResponse?.Response?.ResponseStatus?.Description || 'No message returned';
      
      return {
        success,
        message
      };
    } catch (error) {
      logger.error('Error cancelling UPS shipment', error);
      throw new Error(`Failed to cancel UPS shipment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 
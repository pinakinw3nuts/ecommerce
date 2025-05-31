import { BaseCarrierService } from './BaseCarrierService';
import { CarrierAddress, RateRequest, RateResponse, ShipmentRequest, ShipmentResponse, TrackingRequest, TrackingResponse, TrackingStatus, TrackingEvent } from './ICarrierService';
import { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { logger } from '../utils/logger';

/**
 * FedEx API configuration
 */
interface FedExConfig {
  clientId: string;
  clientSecret: string;
  accountNumber: string;
  meterNumber: string;
  environment: 'production' | 'test';
}

/**
 * FedEx authentication response
 */
interface FedExAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * FedEx service implementation
 */
export class FedExService extends BaseCarrierService {
  private authToken: string | null = null;
  private authExpiry: number = 0;
  
  /**
   * Constructor
   * @param config FedEx API configuration
   */
  constructor(config: FedExConfig) {
    const baseURL = config.environment === 'production'
      ? 'https://apis.fedex.com'
      : 'https://apis-sandbox.fedex.com';
    
    super(baseURL, config);
  }
  
  /**
   * Get carrier ID
   */
  getCarrierId(): string {
    return 'fedex';
  }
  
  /**
   * Get carrier name
   */
  getCarrierName(): string {
    return 'FedEx';
  }
  
  /**
   * Add authentication headers to requests
   * @param config Axios request config
   */
  protected async addAuthHeaders(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    // Skip auth for token endpoint
    if (config.url?.includes('/oauth/token')) {
      return config;
    }
    
    // Get or refresh auth token
    const token = await this.getAuthToken();
    
    // Ensure headers exist
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    
    // Set authorization header
    config.headers.set('Authorization', `Bearer ${token}`);
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
      const response = await this.apiClient.post<FedExAuthResponse>('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      this.authToken = response.data.access_token;
      // Set expiry time with 5 minute buffer
      this.authExpiry = now + (response.data.expires_in * 1000) - (5 * 60 * 1000);
      
      return this.authToken;
    } catch (error) {
      logger.error('FedEx authentication error', error);
      throw new Error('Failed to authenticate with FedEx API');
    }
  }
  
  /**
   * Get supported service types
   */
  async getSupportedServices(): Promise<Array<{code: string, name: string}>> {
    return [
      { code: 'FEDEX_GROUND', name: 'FedEx Ground' },
      { code: 'FEDEX_EXPRESS_SAVER', name: 'FedEx Express Saver' },
      { code: 'FEDEX_2_DAY', name: 'FedEx 2Day' },
      { code: 'FEDEX_2_DAY_AM', name: 'FedEx 2Day A.M.' },
      { code: 'PRIORITY_OVERNIGHT', name: 'FedEx Priority Overnight' },
      { code: 'STANDARD_OVERNIGHT', name: 'FedEx Standard Overnight' },
      { code: 'FIRST_OVERNIGHT', name: 'FedEx First Overnight' },
      { code: 'INTERNATIONAL_ECONOMY', name: 'FedEx International Economy' },
      { code: 'INTERNATIONAL_PRIORITY', name: 'FedEx International Priority' }
    ];
  }
  
  /**
   * Get shipping rates
   * @param request Rate request parameters
   */
  async getRates(request: RateRequest): Promise<RateResponse[]> {
    try {
      // Format request for FedEx API
      const fedexRequest = this.formatRateRequest(request);
      
      // Call FedEx rate API
      const response = await this.apiClient.post('/rate/v1/rates/quotes', fedexRequest);
      
      // Parse and return response
      return this.parseRateResponse(response.data, request);
    } catch (error) {
      logger.error('Error getting FedEx rates', error);
      throw new Error(`Failed to get FedEx rates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Format rate request for FedEx API
   * @param request Rate request
   */
  private formatRateRequest(request: RateRequest): any {
    const { originAddress, destinationAddress, packages, shipDate, serviceType, options } = request;
    
    // Format addresses
    const shipper = this.formatFedExAddress(originAddress);
    const recipient = this.formatFedExAddress(destinationAddress);
    
    // Format packages
    const requestedPackageLineItems = packages.map((pkg, index) => {
      const weightUnit = pkg.weight.unit === 'kg' ? 'KG' : pkg.weight.unit === 'lb' ? 'LB' : 'OZ';
      
      const item: any = {
        weight: {
          units: weightUnit,
          value: pkg.weight.value
        },
        groupPackageCount: 1,
        sequenceNumber: index + 1
      };
      
      // Add dimensions if provided
      if (pkg.dimensions) {
        const dimensionUnit = pkg.dimensions.unit === 'cm' ? 'CM' : 'IN';
        item.dimensions = {
          length: pkg.dimensions.length,
          width: pkg.dimensions.width,
          height: pkg.dimensions.height,
          units: dimensionUnit
        };
      }
      
      // Add declared value if provided
      if (pkg.declaredValue) {
        item.declaredValue = {
          amount: pkg.declaredValue,
          currency: 'USD' // Default to USD, could be made configurable
        };
      }
      
      return item;
    });
    
    // Build request payload
    const payload: any = {
      accountNumber: {
        value: this.config.accountNumber
      },
      rateRequestControlParameters: {
        returnTransitTimes: true,
        servicesNeededOnRateFailure: true
      },
      requestedShipment: {
        shipper,
        recipient,
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        rateRequestType: ['LIST', 'ACCOUNT'],
        requestedPackageLineItems
      }
    };
    
    // Add ship date if provided
    if (shipDate) {
      const formattedDate = shipDate.toISOString().split('T')[0];
      payload.requestedShipment.shipDateStamp = formattedDate;
    }
    
    // Add specific service type if requested
    if (serviceType) {
      payload.requestedShipment.serviceType = serviceType;
    }
    
    return payload;
  }
  
  /**
   * Parse rate response from FedEx API
   * @param response FedEx API response
   * @param request Original rate request
   */
  private parseRateResponse(response: any, request: RateRequest): RateResponse[] {
    const results: RateResponse[] = [];
    
    if (!response.output?.rateReplyDetails) {
      return results;
    }
    
    for (const rateDetail of response.output.rateReplyDetails) {
      const serviceType = rateDetail.serviceType;
      const serviceName = this.getServiceNameByCode(serviceType);
      
      // Get the rate info
      const rateInfo = rateDetail.ratedShipmentDetails[0];
      const totalAmount = rateInfo.totalNetCharge;
      
      // Get delivery time info
      let estimatedDays = 0;
      let estimatedDeliveryDate: Date | undefined;
      
      if (rateDetail.commit?.deliveryTimestamp) {
        estimatedDeliveryDate = new Date(rateDetail.commit.deliveryTimestamp);
        // Calculate days between now and delivery date
        const now = new Date();
        const diffTime = estimatedDeliveryDate.getTime() - now.getTime();
        estimatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else if (rateDetail.commit?.transitTime) {
        // Parse transit time like "ONE_DAY", "TWO_DAYS", etc.
        const transitTimeMap: Record<string, number> = {
          'ONE_DAY': 1,
          'TWO_DAYS': 2,
          'THREE_DAYS': 3,
          'FOUR_DAYS': 4,
          'FIVE_DAYS': 5,
          'SIX_DAYS': 6,
          'SEVEN_DAYS': 7,
          'EIGHT_DAYS': 8,
          'NINE_DAYS': 9,
          'TEN_DAYS': 10
        };
        
        estimatedDays = transitTimeMap[rateDetail.commit.transitTime] || 0;
        
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
        serviceType: serviceType,
        serviceCode: serviceType,
        serviceName: serviceName,
        totalAmount: parseFloat(totalAmount),
        currency: rateInfo.currency || 'USD',
        estimatedDays,
        estimatedDeliveryDate,
        rateDetails: {
          baseRate: parseFloat(rateInfo.totalBaseCharge),
          taxes: parseFloat(rateInfo.totalTaxes || '0'),
          fees: {}
        },
        carrierSpecificData: {
          rateType: rateInfo.rateType,
          rateZone: rateDetail.rateZone
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
      'FEDEX_GROUND': 'FedEx Ground',
      'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
      'FEDEX_2_DAY': 'FedEx 2Day',
      'FEDEX_2_DAY_AM': 'FedEx 2Day A.M.',
      'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
      'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
      'FIRST_OVERNIGHT': 'FedEx First Overnight',
      'INTERNATIONAL_ECONOMY': 'FedEx International Economy',
      'INTERNATIONAL_PRIORITY': 'FedEx International Priority'
    };
    
    return serviceMap[code] || code;
  }
  
  /**
   * Format address for FedEx API
   * @param address Address to format
   */
  private formatFedExAddress(address: CarrierAddress): any {
    return {
      address: {
        streetLines: [
          address.addressLine1,
          ...(address.addressLine2 ? [address.addressLine2] : [])
        ],
        city: address.city,
        stateOrProvinceCode: address.state,
        postalCode: address.postalCode,
        countryCode: address.country,
        residential: address.isResidential || false
      },
      contact: {
        personName: address.name,
        phoneNumber: address.phone || '',
        emailAddress: address.email || ''
      }
    };
  }
  
  /**
   * Create shipment and generate label
   * @param request Shipment request parameters
   */
  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      // Format request for FedEx API
      const fedexRequest = this.formatShipmentRequest(request);
      
      // Call FedEx shipment API
      const response = await this.apiClient.post('/ship/v1/shipments', fedexRequest);
      
      // Parse and return response
      return this.parseShipmentResponse(response.data);
    } catch (error) {
      logger.error('Error creating FedEx shipment', error);
      throw new Error(`Failed to create FedEx shipment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Format shipment request for FedEx API
   * @param request Shipment request
   */
  private formatShipmentRequest(request: ShipmentRequest): any {
    // Implementation would be similar to formatRateRequest but with additional
    // label generation parameters and service selection
    // This is a simplified placeholder
    return {
      // FedEx shipment request format
    };
  }
  
  /**
   * Parse shipment response from FedEx API
   * @param response FedEx API response
   */
  private parseShipmentResponse(response: any): ShipmentResponse {
    // This is a simplified placeholder
    return {
      carrierId: this.getCarrierId(),
      carrierName: this.getCarrierName(),
      trackingNumber: response.output?.shipmentResults?.trackingNumber || '',
      labelUrl: response.output?.shipmentResults?.pieceResponses?.[0]?.labelDocuments?.[0]?.url || '',
      labelData: response.output?.shipmentResults?.pieceResponses?.[0]?.labelDocuments?.[0]?.encodedLabel || '',
      shipmentId: response.output?.transactionId || '',
      totalAmount: parseFloat(response.output?.shipmentResults?.shipmentRating?.shipmentRateDetails?.[0]?.totalNetCharge || '0'),
      currency: response.output?.shipmentResults?.shipmentRating?.shipmentRateDetails?.[0]?.currency || 'USD',
      estimatedDeliveryDate: response.output?.shipmentResults?.completedShipmentDetail?.operationalDetail?.deliveryDate
        ? new Date(response.output.shipmentResults.completedShipmentDetail.operationalDetail.deliveryDate)
        : undefined,
      carrierSpecificData: {
        serviceType: response.output?.shipmentResults?.serviceType || '',
        packagingType: response.output?.shipmentResults?.packagingType || ''
      }
    };
  }
  
  /**
   * Track shipment
   * @param request Tracking request parameters
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      // Call FedEx tracking API
      const response = await this.apiClient.post('/track/v1/trackingnumbers', {
        includeDetailedScans: true,
        trackingInfo: [{
          trackingNumberInfo: {
            trackingNumber: request.trackingNumber
          }
        }]
      });
      
      // Parse and return response
      return this.parseTrackingResponse(response.data);
    } catch (error) {
      logger.error('Error tracking FedEx shipment', error);
      throw new Error(`Failed to track FedEx shipment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Parse tracking response from FedEx API
   * @param response FedEx API response
   */
  private parseTrackingResponse(response: any): TrackingResponse {
    if (!response.output?.completeTrackResults?.[0]?.trackResults?.[0]) {
      throw new Error('Invalid tracking response from FedEx');
    }
    
    const trackResult = response.output.completeTrackResults[0].trackResults[0];
    const trackingNumber = trackResult.trackingNumber;
    
    // Map FedEx status to our TrackingStatus enum
    const statusMap: Record<string, TrackingStatus> = {
      'AA': TrackingStatus.PRE_TRANSIT,
      'AC': TrackingStatus.IN_TRANSIT,
      'AD': TrackingStatus.IN_TRANSIT,
      'AF': TrackingStatus.IN_TRANSIT,
      'AP': TrackingStatus.IN_TRANSIT,
      'AR': TrackingStatus.IN_TRANSIT,
      'AX': TrackingStatus.IN_TRANSIT,
      'CA': TrackingStatus.CANCELLED,
      'CH': TrackingStatus.IN_TRANSIT,
      'DD': TrackingStatus.DELIVERED,
      'DE': TrackingStatus.DELIVERED,
      'DL': TrackingStatus.DELIVERED,
      'DP': TrackingStatus.IN_TRANSIT,
      'DR': TrackingStatus.IN_TRANSIT,
      'DS': TrackingStatus.IN_TRANSIT,
      'DY': TrackingStatus.IN_TRANSIT,
      'EA': TrackingStatus.IN_TRANSIT,
      'ED': TrackingStatus.OUT_FOR_DELIVERY,
      'EO': TrackingStatus.OUT_FOR_DELIVERY,
      'EP': TrackingStatus.IN_TRANSIT,
      'FD': TrackingStatus.IN_TRANSIT,
      'HL': TrackingStatus.IN_TRANSIT,
      'IT': TrackingStatus.IN_TRANSIT,
      'LO': TrackingStatus.IN_TRANSIT,
      'OC': TrackingStatus.IN_TRANSIT,
      'OD': TrackingStatus.OUT_FOR_DELIVERY,
      'OF': TrackingStatus.IN_TRANSIT,
      'OX': TrackingStatus.IN_TRANSIT,
      'PF': TrackingStatus.IN_TRANSIT,
      'PL': TrackingStatus.IN_TRANSIT,
      'PM': TrackingStatus.IN_TRANSIT,
      'PU': TrackingStatus.IN_TRANSIT,
      'PX': TrackingStatus.IN_TRANSIT,
      'SE': TrackingStatus.IN_TRANSIT,
      'SF': TrackingStatus.IN_TRANSIT,
      'SP': TrackingStatus.IN_TRANSIT,
      'TR': TrackingStatus.IN_TRANSIT
    };
    
    // Get current status
    const status = statusMap[trackResult.latestStatusDetail?.code] || TrackingStatus.UNKNOWN;
    
    // Parse events
    const events: TrackingEvent[] = (trackResult.scanEvents || []).map((event: any) => {
      const eventStatus = statusMap[event.eventCode] || TrackingStatus.UNKNOWN;
      
      return {
        timestamp: new Date(event.date + 'T' + event.time),
        status: eventStatus,
        description: event.eventDescription,
        location: event.scanLocation,
        coordinates: event.coordinates ? {
          latitude: event.coordinates.latitude,
          longitude: event.coordinates.longitude
        } : undefined
      };
    });
    
    // Get delivery dates
    let estimatedDeliveryDate: Date | undefined;
    let actualDeliveryDate: Date | undefined;
    
    if (trackResult.dateAndTimes) {
      for (const dateTime of trackResult.dateAndTimes) {
        if (dateTime.type === 'ESTIMATED_DELIVERY') {
          estimatedDeliveryDate = new Date(dateTime.dateTime);
        } else if (dateTime.type === 'ACTUAL_DELIVERY') {
          actualDeliveryDate = new Date(dateTime.dateTime);
        }
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
        serviceType: trackResult.serviceDetail?.type,
        packageWeight: trackResult.packageDetails?.weightAndDimensions?.weight?.[0]?.value,
        packageWeightUnit: trackResult.packageDetails?.weightAndDimensions?.weight?.[0]?.unit
      }
    };
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
      // Call FedEx address validation API
      const response = await this.apiClient.post('/address/v1/addresses/resolve', {
        addressesToValidate: [{
          address: {
            streetLines: [
              address.addressLine1,
              ...(address.addressLine2 ? [address.addressLine2] : [])
            ],
            city: address.city,
            stateOrProvinceCode: address.state,
            postalCode: address.postalCode,
            countryCode: address.country
          }
        }]
      });
      
      // Parse response
      const result = response.data.output?.resolvedAddresses?.[0];
      
      if (!result) {
        return {
          isValid: false,
          messages: ['No address validation result returned']
        };
      }
      
      const isValid = result.customerMessages?.some((msg: any) => msg.code === 'SUCCESS');
      const messages = result.customerMessages?.map((msg: any) => msg.message) || [];
      
      // Extract normalized address if available
      let normalizedAddress: CarrierAddress | undefined;
      
      if (result.resolvedAddress) {
        const addr = result.resolvedAddress;
        
        normalizedAddress = {
          name: address.name,
          addressLine1: addr.streetLines[0],
          addressLine2: addr.streetLines[1] || undefined,
          city: addr.city,
          state: addr.stateOrProvinceCode,
          country: addr.countryCode,
          postalCode: addr.postalCode,
          phone: address.phone,
          email: address.email,
          isResidential: addr.residential
        };
      }
      
      return {
        isValid: !!isValid,
        normalizedAddress,
        messages
      };
    } catch (error) {
      logger.error('Error validating address with FedEx', error);
      throw new Error(`Failed to validate address with FedEx: ${error instanceof Error ? error.message : String(error)}`);
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
      // Call FedEx shipment cancellation API
      const response = await this.apiClient.put(`/ship/v1/shipments/cancel/${shipmentId}`, {});
      
      // Check if cancellation was successful
      const success = response.data.output?.success || false;
      const message = response.data.output?.message || 'No message returned';
      
      return {
        success,
        message
      };
    } catch (error) {
      logger.error('Error cancelling FedEx shipment', error);
      throw new Error(`Failed to cancel FedEx shipment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 
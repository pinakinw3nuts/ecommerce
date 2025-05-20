export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  INTERNATIONAL = 'INTERNATIONAL'
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  baseRate: number;
  rateMultiplier: number;
}

export interface ShippingOption {
  method: ShippingMethod;
  carrier: string;
  estimatedDays: string;
  cost: number;
}

interface AddressInfo {
  pincode?: string;
  country: string;
  state?: string;
  city?: string;
}

const FREE_SHIPPING_THRESHOLD = 100.00; // Free shipping for orders over $100
const BASE_SHIPPING_COST = 10.00; // Base shipping cost

export class ShippingService {
  private readonly shippingZones: ShippingZone[] = [
    {
      id: 'zone1',
      name: 'Domestic Zone 1',
      countries: ['US'],
      baseRate: 10.00,
      rateMultiplier: 1.0
    },
    {
      id: 'zone2',
      name: 'Domestic Zone 2',
      countries: ['CA', 'MX'],
      baseRate: 15.00,
      rateMultiplier: 1.2
    },
    {
      id: 'zone3',
      name: 'International Zone 1',
      countries: ['GB', 'FR', 'DE', 'IT', 'ES'],
      baseRate: 25.00,
      rateMultiplier: 1.5
    },
    {
      id: 'zone4',
      name: 'International Zone 2',
      countries: ['AU', 'JP', 'CN', 'IN'],
      baseRate: 35.00,
      rateMultiplier: 1.8
    }
  ];

  private readonly carriers: Record<ShippingMethod, string[]> = {
    [ShippingMethod.STANDARD]: ['USPS', 'FedEx Ground'],
    [ShippingMethod.EXPRESS]: ['FedEx Express', 'UPS Express'],
    [ShippingMethod.OVERNIGHT]: ['FedEx Overnight', 'UPS Next Day Air'],
    [ShippingMethod.INTERNATIONAL]: ['DHL', 'FedEx International']
  };

  private readonly deliveryEstimates: Record<ShippingMethod, { domestic: string; international: string }> = {
    [ShippingMethod.STANDARD]: {
      domestic: '3-5 business days',
      international: '7-14 business days'
    },
    [ShippingMethod.EXPRESS]: {
      domestic: '2-3 business days',
      international: '3-5 business days'
    },
    [ShippingMethod.OVERNIGHT]: {
      domestic: 'Next business day',
      international: '2-3 business days'
    },
    [ShippingMethod.INTERNATIONAL]: {
      domestic: 'N/A',
      international: '5-7 business days'
    }
  };

  private getShippingZone(country: string): ShippingZone {
    const defaultZone = this.shippingZones[3]; // International Zone 2
    return this.shippingZones.find(z => z.countries.includes(country)) as ShippingZone || defaultZone;
  }

  private isPremiumPincode(pincode: string): boolean {
    // Mock premium pincodes (e.g., metropolitan areas) for demo
    const premiumPincodes = ['10001', '90210', '60601', '94105', '02108'];
    return premiumPincodes.includes(pincode);
  }

  private calculateMethodCost(
    baseRate: number,
    rateMultiplier: number,
    method: ShippingMethod,
    weight: number = 1
  ): number {
    const methodMultipliers = {
      [ShippingMethod.STANDARD]: 1.0,
      [ShippingMethod.EXPRESS]: 1.5,
      [ShippingMethod.OVERNIGHT]: 2.5,
      [ShippingMethod.INTERNATIONAL]: 2.0
    };

    const cost = baseRate * rateMultiplier * methodMultipliers[method] * weight;
    return Number(cost.toFixed(2));
  }

  async getShippingOptions(
    address: AddressInfo,
    orderWeight: number = 1
  ): Promise<ShippingOption[]> {
    const zone = this.getShippingZone(address.country);
    const isDomestic = zone.id === 'zone1';
    const options: ShippingOption[] = [];

    // Apply premium pincode surcharge
    const premiumMultiplier = address.pincode && this.isPremiumPincode(address.pincode) ? 1.2 : 1.0;

    // Generate available shipping methods based on location
    const availableMethods = isDomestic
      ? [ShippingMethod.STANDARD, ShippingMethod.EXPRESS, ShippingMethod.OVERNIGHT]
      : [ShippingMethod.STANDARD, ShippingMethod.EXPRESS, ShippingMethod.INTERNATIONAL];

    for (const method of availableMethods) {
      const carrierOptions = this.carriers[method];
      const carrier = carrierOptions[Math.floor(Math.random() * carrierOptions.length)];
      const estimatedDays = this.deliveryEstimates[method][isDomestic ? 'domestic' : 'international'];
      
      const cost = this.calculateMethodCost(
        zone.baseRate,
        zone.rateMultiplier * premiumMultiplier,
        method,
        orderWeight
      );

      if (carrier && estimatedDays) {
        options.push({
          method,
          carrier,
          estimatedDays,
          cost
        });
      }
    }

    return options.sort((a, b) => a.cost - b.cost);
  }

  async validatePincode(pincode: string, country: string): Promise<boolean> {
    // Mock pincode validation
    const pincodePatterns: Record<string, RegExp> = {
      'US': /^\d{5}(-\d{4})?$/,
      'CA': /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
      'GB': /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/,
      'IN': /^\d{6}$/
    };

    const pattern = pincodePatterns[country];
    if (!pattern) return true; // Skip validation for countries without patterns

    return pattern.test(pincode);
  }

  async estimateDeliveryDate(
    method: ShippingMethod,
    country: string
  ): Promise<{ earliest: Date; latest: Date }> {
    const isDomestic = country === 'US';
    const estimate = this.deliveryEstimates[method][isDomestic ? 'domestic' : 'international'];
    
    const [minDaysStr, maxDaysStr] = estimate.split('-').map(d => d.match(/\d+/)?.[0]);
    const minDays = minDaysStr ? parseInt(minDaysStr) : 1;
    const maxDays = maxDaysStr ? parseInt(maxDaysStr) : minDays;

    const earliest = new Date();
    earliest.setDate(earliest.getDate() + minDays);

    const latest = new Date();
    latest.setDate(latest.getDate() + maxDays);

    return { earliest, latest };
  }

  calculateShippingCost(subtotal: number): number {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return BASE_SHIPPING_COST;
  }
} 
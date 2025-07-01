export interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  order: 'ASC' | 'DESC';
}

export interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

// Shipping Method
export interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description?: string;
  baseRate: number;
  estimatedDays: number;
  icon?: string;
  isActive: boolean;
  settings?: Record<string, any>;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethodFilters {
  isActive?: boolean;
  search?: string;
  minRate?: string;
  maxRate?: string;
}

export interface ShippingMethodsResponse {
  methods: ShippingMethod[];
  pagination: PaginationData;
}

// Shipping Zone
export interface Region {
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  code: string;
  description?: string;
  countries: string[];
  regions: Region[];
  pincodePatterns: string[];
  pincodeRanges?: { start: string; end: string; }[];
  excludedPincodes?: string[];
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  rates?: {
    id: string;
    name: string;
    rate: string;
    isActive: boolean;
  }[];
  methods?: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  }[];
}

export interface ShippingZoneFilters {
  search?: string;
  countries?: string[];
  isActive?: boolean;
}

export interface ShippingZonesResponse {
  zones: ShippingZone[];
  pagination: PaginationInfo;
}

export interface ShippingZoneUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  countries?: string[];
  isActive?: boolean;
}

// Shipping Rate
export interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  shippingMethodId: string;
  shippingZoneId: string;
  minWeight?: number;
  maxWeight?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  estimatedDays?: number;
  conditions?: {
    productCategories?: string[];
    customerGroups?: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingRateFilters {
  isActive?: boolean;
  shippingMethodId?: string;
  shippingZoneId?: string;
  search?: string;
}

export interface ShippingRatesResponse {
  rates: ShippingRate[];
  pagination: PaginationData;
}

// Shipping carrier type enum
export enum ShippingCarrierType {
  DOMESTIC = 'domestic',
  INTERNATIONAL = 'international',
  BOTH = 'both',
  CUSTOM = 'custom'
}

// Shipping carrier interface
export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  type: ShippingCarrierType;
  description: string;
  logo: string | null;
  isEnabled: boolean;
  supportedCountries: string[];
  minimumWeight: number | null;
  maximumWeight: number | null;
  excludedRegions: string[] | null;
  handlingInstructions: string | null;
  handlingFee: number | null;
  handlingFeeType: 'fixed' | 'percentage' | null;
  estimatedDeliveryTime: string | null;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCarriersResponse {
  items: ShippingCarrier[];
  pagination: PaginationResponse;
} 
import apiClient from '../lib/api';
import { buildQueryString } from '../lib/utils';
import { AxiosResponse } from 'axios';
import { 
  ShippingMethod, 
  ShippingZone, 
  ShippingRate,
  ShippingCarrier,
  ShippingCarriersResponse,
  ShippingCarrierType
} from '../types/shipping';

// ... existing code ...

export interface ShippingCarrierListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  enabled?: boolean;
  type?: string[] | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateShippingCarrierParams {
  name: string;
  code: string;
  type: ShippingCarrierType;
  description: string;
  logo?: string | null;
  isEnabled: boolean;
  supportedCountries: string[];
  minimumWeight?: number | null;
  maximumWeight?: number | null;
  excludedRegions?: string[] | null;
  handlingInstructions?: string | null;
  handlingFee?: number | null;
  handlingFeeType?: 'fixed' | 'percentage' | null;
  estimatedDeliveryTime?: string | null;
  settings: Record<string, any>;
}

export const shippingApi = {
  // ... existing code ...

  // Shipping Carrier Methods
  async listShippingCarriers(params: ShippingCarrierListParams = {}): Promise<ShippingCarriersResponse> {
    const queryString = buildQueryString(params);
    const response: AxiosResponse<ShippingCarriersResponse> = await apiClient.get(`/api/shipping/carriers${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  async getShippingCarrier(id: string): Promise<ShippingCarrier> {
    const response: AxiosResponse<ShippingCarrier> = await apiClient.get(`/api/shipping/carriers/${id}`);
    return response.data;
  },

  async createShippingCarrier(data: CreateShippingCarrierParams): Promise<ShippingCarrier> {
    const response: AxiosResponse<ShippingCarrier> = await apiClient.post('/api/shipping/carriers', data);
    return response.data;
  },

  async updateShippingCarrier(id: string, data: Partial<CreateShippingCarrierParams>): Promise<ShippingCarrier> {
    const response: AxiosResponse<ShippingCarrier> = await apiClient.put(`/api/shipping/carriers/${id}`, data);
    return response.data;
  },

  async deleteShippingCarrier(id: string): Promise<void> {
    await apiClient.delete(`/api/shipping/carriers/${id}`);
  },

  async toggleShippingCarrierStatus(id: string): Promise<ShippingCarrier> {
    const response: AxiosResponse<ShippingCarrier> = await apiClient.post(`/api/shipping/carriers/${id}/toggle-status`);
    return response.data;
  },

  async reorderShippingCarriers(carrierIds: string[]): Promise<void> {
    await apiClient.post('/api/shipping/carriers/reorder', { carrierIds });
  }
}; 
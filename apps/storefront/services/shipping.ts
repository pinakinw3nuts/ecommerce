import { createApiClient } from '@/lib/apiClient';
import { ShippingMethod, DEFAULT_SHIPPING_METHODS } from '@/types/shipping';

const SHIPPING_SERVICE_URL = process.env.NEXT_PUBLIC_SHIPPING_SERVICE_URL || 'http://localhost:3008/api/v1';
const shippingServiceApi = createApiClient(SHIPPING_SERVICE_URL);

// Adjusted Address type to match what might be returned by the shipping service
export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  pincode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  landmark?: string;
  isDefault?: boolean;
  additionalInfo?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type AddressInput = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type: 'shipping' | 'billing' | 'both';
};


export const calculateShippingCost = async (shippingDetails: {
  address: AddressInput;
  items: Array<{ productId: string; quantity: number; price: number; }>;
}) => {
  return shippingServiceApi.post('/calculate-cost', shippingDetails);
};

export const trackShipment = async (trackingId: string) => {
  return shippingServiceApi.get(`/track/${trackingId}`);
};

export const addShippingAddress = async (addressData: AddressInput) => {
  return shippingServiceApi.post('/addresses', addressData);
};

export const updateAddress = async (id: string, addressData: AddressInput) => {
  return shippingServiceApi.put(`/addresses/${id}`, addressData);
};

export const deleteAddress = async (id: string) => {
  return shippingServiceApi.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id: string) => {
  return shippingServiceApi.patch(`/addresses/${id}/default`, {});
};

export const getAvailableShippingMethods = async (address: { pincode: string; country: string }): Promise<ShippingOption[]> => {
  const query = new URLSearchParams(address as Record<string, string>).toString();
  return shippingServiceApi.get<ShippingOption[]>(`/shipping/methods/available?${query}`);
};

export const fetchUserAddresses = async (): Promise<SavedAddress[]> => {
  try {
    return await shippingServiceApi.get<SavedAddress[]>(`/addresses/`);
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

export interface ShippingOption {
  method: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'INTERNATIONAL';
  carrier: string;
  cost: number;
  estimatedDays: string;
  estimatedDelivery: {
    earliest: string;
    latest: string;
  };
} 
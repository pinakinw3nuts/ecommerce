import axios from '../lib/api';
import { ShippingMethod, DEFAULT_SHIPPING_METHODS } from '@/types/shipping';

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
  return axios.post('/calculate-cost', shippingDetails);
};

export const trackShipment = async (trackingId: string) => {
  return axios.get(`/track/${trackingId}`);
};

export const addShippingAddress = async (addressData: AddressInput) => {
  return axios.post('/addresses', addressData);
};

export const updateAddress = async (id: string, addressData: AddressInput) => {
  return axios.put(`/addresses/${id}`, addressData);
};

export const deleteAddress = async (id: string) => {
  return axios.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id: string) => {
  return axios.patch(`/addresses/${id}/default`, {});
};

export const getAvailableShippingMethods = async (address: { pincode: string; country: string }): Promise<ShippingOption[]> => {
  const query = new URLSearchParams(address as Record<string, string>).toString();
  const response = await axios.get<ShippingOption[]>(`/shipping/methods/available?${query}`);
  return response.data;
};

export const fetchUserAddresses = async (): Promise<SavedAddress[]> => {
  try {
    const response = await axios.get<SavedAddress[]>(`/addresses/`);
    return response.data;
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
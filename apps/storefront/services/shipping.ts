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
  return axios.post('/shipping/calculate-cost', shippingDetails);
};

export const trackShipment = async (trackingId: string) => {
  return axios.get(`/shipping/track/${trackingId}`);
};

export const addShippingAddress = async (addressData: AddressInput) => {
  return axios.post('/shipping/addresses', addressData);
};

export const updateAddress = async (id: string, addressData: AddressInput) => {
  return axios.put(`/shipping/addresses/${id}`, addressData);
};

export const deleteAddress = async (id: string) => {
  return axios.delete(`/shipping/addresses/${id}`);
};

export const setDefaultAddress = async (id: string) => {
  return axios.patch(`/shipping/addresses/${id}/default`, {});
};

export const getAvailableShippingMethods = async (address: { pincode: string; country: string }): Promise<ShippingMethod[]> => {
  try {
    // Use consistent pattern with central axios instance through Next.js API route
    const response = await axios.get(`/shipping/methods/available?pincode=${address.pincode}`);
    
    // Map the shipping API response to our ShippingMethod interface
    return response.data.map((method: ShippingOption) => ({
      method: method.code,
      label: method.name,
      description: `${method.description || `Delivery in ${method.estimatedDays} days`}`,
      price: method.baseRate || 0,
      estimatedDays: method.estimatedDays || 0,
    }));
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    // Return default methods if API call fails
    return DEFAULT_SHIPPING_METHODS;
  }
};

export const fetchUserAddresses = async (): Promise<SavedAddress[]> => {
  try {
    // Use consistent pattern with central axios instance
    const response = await axios.get<SavedAddress[]>(`/shipping/addresses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

// Updated to match the shipping service API response
export interface ShippingOption {
  id: string;
  name: string;
  code: string;
  description: string;
  baseRate: number;
  estimatedDays: number;
  icon: string;
  eta?: {
    days: number;
    estimatedDeliveryDate: string;
  };
} 
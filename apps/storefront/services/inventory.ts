import { createApiClient } from '../lib/apiClient';

const inventoryServiceApi = createApiClient(process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || 'http://localhost:3014/api/v1');

export const getProductAvailability = async (productId: string) => {
  return inventoryServiceApi.get(`/inventory/${productId}`);
};

export const updateStock = async (productId: string, quantity: number, operation: 'add' | 'subtract') => {
  return inventoryServiceApi.post(`/inventory/${productId}/stock`, { quantity, operation });
};

export const reserveStock = async (productId: string, quantity: number) => {
  return inventoryServiceApi.post(`/inventory/${productId}/reserve`, { quantity });
};

export const releaseStock = async (productId: string, quantity: number) => {
  return inventoryServiceApi.post(`/inventory/${productId}/release`, { quantity });
}; 
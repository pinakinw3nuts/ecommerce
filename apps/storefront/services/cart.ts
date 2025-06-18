// lib/cart.ts
import { createApiClient } from '../lib/apiClient';

const cartServiceApi = createApiClient(process.env.NEXT_PUBLIC_CART_SERVICE_URL || 'http://localhost:3004/api/v1');

export const fetchCart = async (userId: string) => {
    return cartServiceApi.get(`/cart/${userId}`);
};

export const updateCart = async (userId: string, payload: any) => {
    return cartServiceApi.put(`/cart/${userId}`, payload);
};

export const addToCart = async (userId: string, item: any) => {
    return cartServiceApi.post(`/cart/${userId}/add`, item);
};

export const removeFromCart = async (userId: string, itemId: string) => {
    return cartServiceApi.delete(`/cart/${userId}/remove/${itemId}`);
};

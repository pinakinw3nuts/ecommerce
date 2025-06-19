// lib/cart.ts
import axios from '@/lib/api';  

const CART_SERVICE_URL = process.env.NEXT_PUBLIC_CART_SERVICE_URL || 'http://127.0.0.1:3004/api/v1';

export const fetchCart = async (userId: string) => {
    return axios.get(`${CART_SERVICE_URL}/cart/${userId}`);
};

export const updateCart = async (userId: string, payload: any) => {
    return axios.put(`${CART_SERVICE_URL}/cart/${userId}`, payload);
};

export const addToCart = async (userId: string, item: any) => {
    return axios.post(`${CART_SERVICE_URL}/cart/${userId}/add`, item);
};

export const removeFromCart = async (userId: string, itemId: string) => {
    return axios.delete(`${CART_SERVICE_URL}/cart/${userId}/remove/${itemId}`);
};

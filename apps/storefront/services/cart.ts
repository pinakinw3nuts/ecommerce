// lib/cart.ts
import axios from 'axios';

const CART_API = process.env.NEXT_PUBLIC_CART_SERVICE_URL;

export const fetchCart = async (userId: string) => {
    const res = await axios.get(`${CART_API}/cart/${userId}`);
    return res.data;
};

export const updateCart = async (userId: string, payload: any) => {
    const res = await axios.put(`${CART_API}/cart/${userId}`, payload);
    return res.data;
};

export const addToCart = async (userId: string, item: any) => {
    const res = await axios.post(`${CART_API}/cart/${userId}/add`, item);
    return res.data;
};

export const removeFromCart = async (userId: string, itemId: string) => {
    const res = await axios.delete(`${CART_API}/cart/${userId}/remove/${itemId}`);
    return res.data;
};

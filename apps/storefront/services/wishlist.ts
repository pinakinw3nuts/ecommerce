import axios from '../lib/api';

const WISHLIST_SERVICE_URL = process.env.NEXT_PUBLIC_WISHLIST_SERVICE_URL || 'http://localhost:3011/api/v1';

export const fetchWishlist = async (userId: string) => {
  return axios.get(`${WISHLIST_SERVICE_URL}/wishlists/${userId}`);
};

export const addItemToWishlist = async (userId: string, productId: string) => {
  return axios.post(`${WISHLIST_SERVICE_URL}/wishlists/${userId}/items`, { productId });
};

export const removeItemFromWishlist = async (userId: string, productId: string) => {
  return axios.delete(`${WISHLIST_SERVICE_URL}/wishlists/${userId}/items/${productId}`);
}; 
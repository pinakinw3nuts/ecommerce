import { createApiClient } from '../lib/apiClient';

const wishlistServiceApi = createApiClient(process.env.NEXT_PUBLIC_WISHLIST_SERVICE_URL || 'http://localhost:3011/api/v1');

export const fetchWishlist = async (userId: string) => {
  return wishlistServiceApi.get(`/wishlists/${userId}`);
};

export const addItemToWishlist = async (userId: string, productId: string) => {
  return wishlistServiceApi.post(`/wishlists/${userId}/items`, { productId });
};

export const removeItemFromWishlist = async (userId: string, productId: string) => {
  return wishlistServiceApi.delete(`/wishlists/${userId}/items/${productId}`);
}; 
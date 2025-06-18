import { createApiClient } from '../lib/apiClient';

const pricingServiceApi = createApiClient(process.env.NEXT_PUBLIC_PRICING_SERVICE_URL || 'http://localhost:3013/api/v1');

export const getProductPrice = async (productId: string, currency: string) => {
  return pricingServiceApi.get(`/prices/${productId}?currency=${currency}`);
};

export const calculateCartTotal = async (cartItems: any) => {
  return pricingServiceApi.post('/calculate-total', { cartItems });
};

export const applyCoupon = async (couponCode: string, cartId: string) => {
  return pricingServiceApi.post('/apply-coupon', { couponCode, cartId });
}; 
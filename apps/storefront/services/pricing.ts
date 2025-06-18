import axios from '../lib/api';

const PRICING_SERVICE_URL = process.env.NEXT_PUBLIC_PRICING_SERVICE_URL || 'http://localhost:3013/api/v1';

export const getProductPrice = async (productId: string, currency: string) => {
  return axios.get(`${PRICING_SERVICE_URL}/prices/${productId}?currency=${currency}`);
};

export const calculateCartTotal = async (cartItems: any) => {
  return axios.post(`${PRICING_SERVICE_URL}/calculate-total`, { cartItems });
};

export const applyCoupon = async (couponCode: string, cartId: string) => {
  return axios.post(`${PRICING_SERVICE_URL}/apply-coupon`, { couponCode, cartId });
}; 
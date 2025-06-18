import axios from '../lib/api';
import { AddressInput } from '../services/shipping';
import * as shippingService from '../services/shipping';

const CHECKOUT_API_ROUTE = '/checkout';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  metadata?: Record<string, any>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface OrderPreview {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  items: CartItem[];
}

export interface CheckoutSession {
  id: string;
  userId: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  totals?: {
    subtotal: number;
    tax: number;
    shippingCost: number;
    discount: number;
    total: number;
  };
  // Direct properties that might exist in some API responses
  total?: number;
  subtotal?: number;
  cartSnapshot?: Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
    metadata?: Record<string, any>;
  }>;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  discountCode?: string;
  paymentIntentId?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  expiresAt: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApiResponse<T> = {
  data: T;
  message?: string;
  [key: string]: any;
};

// Calculate order preview with shipping and discount
export async function calculateOrderPreview(
  userId: string,
  cartItems: CartItem[],
  couponCode?: string,
  shippingAddress?: Address
): Promise<ApiResponse<OrderPreview>> {
  const response = await axios.post<ApiResponse<OrderPreview>>(`${CHECKOUT_API_ROUTE}/preview`, {
    userId,
    cartItems,
    couponCode,
    shippingAddress
  });
  return response.data;
}

// Get available shipping options - now delegates to shippingService
export async function fetchShippingOptions(
  address: AddressInput,
  orderWeight?: number
): Promise<shippingService.ShippingOption[]> {
  // Pass only required fields (pincode, country) from address to getAvailableShippingMethods
  const { pincode, country } = address;
  return shippingService.getAvailableShippingMethods({ pincode, country });
}

// Validate postal/zip code
export async function validatePincode(
  pincode: string,
  country: string
): Promise<boolean> {
  const response = await axios.post<boolean>(`${CHECKOUT_API_ROUTE}/validate-pincode`, {
    pincode,
    country
  });
  return response.data;
}

// Create checkout session
export async function createCheckoutSession(
  userId: string,
  cartItems: CartItem[],
  couponCode?: string,
  shippingAddress?: Address,
  billingAddress?: Address
): Promise<ApiResponse<CheckoutSession>> {
  const response = await axios.post<ApiResponse<CheckoutSession>>(`${CHECKOUT_API_ROUTE}/session`, {
    userId,
    cartItems,
    couponCode,
    shippingAddress,
    billingAddress
  });
  return response.data;
}

// Get checkout session
export async function getCheckoutSession(id: string): Promise<ApiResponse<CheckoutSession>> {
  const response = await axios.get<ApiResponse<CheckoutSession>>(`${CHECKOUT_API_ROUTE}/session/${id}`);
  return response.data;
}

// Complete checkout session (after payment)
export async function completeCheckoutSession(
  id: string,
  paymentIntentId: string
): Promise<CheckoutSession> {
  const response = await axios.post<CheckoutSession>(`${CHECKOUT_API_ROUTE}/session/${id}/complete`, {
    paymentIntentId
  });
  return response.data;
}

export async function updateShippingMethod(
  id: string,
  shippingMethod: string
): Promise<CheckoutSession> {
  const response = await axios.put<CheckoutSession>(`${CHECKOUT_API_ROUTE}/session/${id}/shipping-method`, {
    shippingMethod
  });
  return response.data;
}

export async function applyDiscountCode(
  id: string,
  discountCode: string
): Promise<CheckoutSession> {
  const response = await axios.post<CheckoutSession>(`${CHECKOUT_API_ROUTE}/session/${id}/apply-discount`, {
    discountCode
  });
  return response.data;
}

export async function removeDiscountCode(id: string): Promise<CheckoutSession> {
  const response = await axios.post<CheckoutSession>(`${CHECKOUT_API_ROUTE}/session/${id}/remove-discount`, {});
  return response.data;
}

export async function updateShippingAddress(
  id: string,
  address: Address
): Promise<CheckoutSession> {
    const response = await axios.put<CheckoutSession>(`${CHECKOUT_API_ROUTE}/session/${id}/shipping-address`, {
    address
  });
  return response.data;
}

export async function updateBillingAddress(
  id: string,
  address: Address
): Promise<CheckoutSession> {
  const response = await axios.put<CheckoutSession>(`${CHECKOUT_API_ROUTE}/session/${id}/billing-address`, {
    address
  });
  return response.data;
}

export async function createPaymentIntent(
  id: string,
  amount: number
): Promise<{ clientSecret: string }> {
  const response = await axios.post<{ clientSecret: string }>(`${CHECKOUT_API_ROUTE}/session/${id}/create-payment-intent`, { amount });
  return response.data;
}

export const placeOrder = async (id: string, address: AddressInput) => {
  const response = await axios.post(`${CHECKOUT_API_ROUTE}/checkout/session/${id}/order`, { address });
  return response.data;
}; 
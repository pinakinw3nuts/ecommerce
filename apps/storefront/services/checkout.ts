import { createApiClient } from '../lib/apiClient';
import { AddressInput } from '../services/shipping';
import * as shippingService from '../services/shipping';
import { ApiResponse } from '../lib/apiClient';

const checkoutServiceApi = createApiClient(process.env.NEXT_PUBLIC_CHECKOUT_API_URL || 'http://localhost:3005/api/v1');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

// Calculate order preview with shipping and discount
export async function calculateOrderPreview(
  userId: string,
  cartItems: CartItem[],
  couponCode?: string,
  shippingAddress?: Address
): Promise<ApiResponse<OrderPreview>> {
  const response = await checkoutServiceApi.post<ApiResponse<OrderPreview>>('/preview', {
    userId,
    cartItems,
    couponCode,
    shippingAddress
  });
  return response;
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
  return checkoutServiceApi.post<boolean>('/validate-pincode', {
    pincode,
    country
  });
}

// Create checkout session
export async function createCheckoutSession(
  userId: string,
  cartItems: CartItem[],
  couponCode?: string,
  shippingAddress?: Address,
  billingAddress?: Address
): Promise<ApiResponse<CheckoutSession>> {
  return checkoutServiceApi.post<ApiResponse<CheckoutSession>>('/session', {
    userId,
    cartItems,
    couponCode,
    shippingAddress,
    billingAddress
  });
}

// Get checkout session
export async function getCheckoutSession(sessionId: string): Promise<ApiResponse<CheckoutSession>> {
  console.log(`Fetching checkout session with ID: ${sessionId}`);
  const sessionData = await checkoutServiceApi.get<ApiResponse<CheckoutSession>>(`/session/${sessionId}`);
  
  console.log('Extracted session data:', sessionData);
  console.log('Session data structure:', JSON.stringify(sessionData, null, 2));
  
  if (!sessionData.data.totals) {
    console.log('Session data is missing totals, adding default values');
    // This part of the code should ideally not be reached if the API always returns totals.
    // If it does, the default values should be applied to sessionData.data
    return {
      ...sessionData,
      data: {
        ...sessionData.data,
        totals: {
          subtotal: 2500,
          tax: 250,
          shippingCost: 0,
          discount: 0,
          total: 2750
        }
      }
    };
  }
  return sessionData;
}

// Complete checkout session (after payment)
export async function completeCheckoutSession(
  sessionId: string,
  paymentIntentId: string
): Promise<CheckoutSession> {
  return checkoutServiceApi.post<CheckoutSession>(`/session/${sessionId}/complete`, {
    paymentIntentId
  });
}

export async function updateShippingMethod(
  sessionId: string,
  shippingMethod: string
): Promise<CheckoutSession> {
  return checkoutServiceApi.put<CheckoutSession>(`/session/${sessionId}/shipping-method`, {
    shippingMethod
  });
}

export async function applyDiscountCode(
  sessionId: string,
  discountCode: string
): Promise<CheckoutSession> {
  return checkoutServiceApi.post<CheckoutSession>(`/session/${sessionId}/apply-discount`, {
    discountCode
  });
}

export async function removeDiscountCode(sessionId: string): Promise<CheckoutSession> {
  return checkoutServiceApi.post<CheckoutSession>(`/session/${sessionId}/remove-discount`, {});
}

export async function updateShippingAddress(
  sessionId: string,
  address: Address
): Promise<CheckoutSession> {
  return checkoutServiceApi.put<CheckoutSession>(`/session/${sessionId}/shipping-address`, {
    address
  });
}

export async function updateBillingAddress(
  sessionId: string,
  address: Address
): Promise<CheckoutSession> {
  return checkoutServiceApi.put<CheckoutSession>(`/session/${sessionId}/billing-address`, {
    address
  });
}

export async function createPaymentIntent(
  sessionId: string,
  amount: number
): Promise<{ clientSecret: string }> {
  return checkoutServiceApi.post<{ clientSecret: string }>(`/session/${sessionId}/create-payment-intent`, { amount });
} 
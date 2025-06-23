import axios from '../lib/api';
import { AddressInput } from '../services/shipping';
import * as shippingService from '../services/shipping';
import { ShippingMethod } from '@/types/shipping';

const CHECKOUT_API_ROUTE = '/checkout';

// Keys for localStorage
export const ORDER_SUBMISSION_KEY = 'order_submission_status';
export const CHECKOUT_SESSION_KEY = 'checkout_session';
export const CHECKOUT_FALLBACK_KEY = 'checkout_fallback_data';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  imageUrl?: string;
  additionalImages?: string[];
  variant?: string;
  variantId?: string;
  variantName?: string;
  description?: string;
  sku?: string;
  inStock?: boolean;
  brand?: {
    id?: string;
    name?: string;
    logoUrl?: string;
  };
  category?: {
    id?: string;
    name?: string;
  };
  attributes?: {
    [key: string]: string | number | boolean;
  };
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  originalPrice?: number;
  salePrice?: number;
  slug?: string;
  metadata?: Record<string, any>;
  productSnapshot?: {
    name?: string;
    imageUrl?: string;
    variantName?: string;
    [key: string]: any;
  };
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
  cartSnapshot?: CartItem[];
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
  shippingAddress?: Address,
  shippingMethod?: string
): Promise<ApiResponse<OrderPreview>> {
  try {
    // First get order preview from backend
    const response = await axios.post<ApiResponse<OrderPreview>>(`${CHECKOUT_API_ROUTE}/preview`, {
      userId,
      cartItems: cartItems,
      couponCode,
      shippingAddress,
      shippingMethod,
    });
    
    const orderPreview = response.data.data;
    
    // If we have a shipping address and method, try to get real shipping cost
    if (shippingAddress && shippingMethod) {
      try {
        // Get shipping methods for this address
        const shippingMethods = await shippingService.getAvailableShippingMethods({
          pincode: shippingAddress.zipCode,
          country: shippingAddress.country
        });
        
        // Find the selected method in the available methods
        const selectedMethod = shippingMethods.find(method => method.method === shippingMethod);
        
        // If found, update the shipping cost in the order preview
        if (selectedMethod) {
          orderPreview.shippingCost = selectedMethod.price;
          // Recalculate total
          orderPreview.total = orderPreview.subtotal + orderPreview.shippingCost + 
                              orderPreview.tax - orderPreview.discount;
        }
      } catch (error) {
        console.error('Error fetching shipping cost:', error);
        // Continue with default shipping cost from backend
      }
    }
    
    return {
      ...response.data,
      data: orderPreview
    };
  } catch (error) {
    console.error('Error calculating order preview:', error);
    throw error;
  }
}

// Get available shipping options - now delegates to shippingService
export async function fetchShippingOptions(
  address: AddressInput,
  orderWeight?: number
): Promise<ShippingMethod[]> {
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

// Generic method to update any checkout session field
export async function updateCheckoutSession(
  id: string,
  data: Partial<CheckoutSession>
): Promise<ApiResponse<CheckoutSession>> {
  const response = await axios.patch<ApiResponse<CheckoutSession>>(`${CHECKOUT_API_ROUTE}/session/${id}`, data);
  return response.data;
} 
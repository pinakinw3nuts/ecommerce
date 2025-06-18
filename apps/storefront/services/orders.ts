import { Order, OrdersResponse } from '@/lib/types/order';
import axios from '../lib/api';


// Helper function to handle API response status codes
async function handleApiResponse<T>(url: string, method: 'GET' | 'POST' | 'PUT', body?: any): Promise<T> {
  try {
    let result;
    if (method === 'GET') {
      result = await axios.get<T>(url);
    } else if (method === 'POST') {
      result = await axios.post<T>(url, body || {});
    } else if (method === 'PUT') {
      result = await axios.put<T>(url, body || {});
    }
    return result as T;
  } catch (error: any) {
    console.error(`API ${method} request to ${url} failed:`, error);
    // Re-throw the error to be caught by the caller
    throw error;
  }
}

export async function fetchOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
}): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.status?.length) searchParams.set('status', params.status.join(','));
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);

  return handleApiResponse<OrdersResponse>(`/orders?${searchParams.toString()}`, 'GET');
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  return handleApiResponse<Order>(`/orders/${orderId}`, 'GET');
}

export async function cancelOrder(orderId: string): Promise<void> {
  return handleApiResponse<void>(`/orders/${orderId}/cancel`, 'POST');
}

export async function createOrder(orderData: {
  items: { productId: string; quantity: number }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}): Promise<Order> {
  return handleApiResponse<Order>('/orders', 'POST', orderData);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  return handleApiResponse<Order>(`/orders/${orderId}`, 'PUT', { status });
}

export async function createOrderFromCheckout(checkoutSessionId: string): Promise<Order> {
  console.log('Creating order from checkout session:', checkoutSessionId);
  
  try {
    // Use custom fetch to handle the 201 status code
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://127.0.0.1:3006/api/v1'}/orders/checkout`, 
      {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ checkoutSessionId }),
      }
    );
    
    console.log('Order creation response status:', response.status);
    
    if (!response.ok && response.status !== 201) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`Failed to create order: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Save order ID to localStorage to ensure we can redirect to it
    if (data && data.id) {
      localStorage.setItem('last_order_id', data.id);
      // Also store that order was completed successfully
      localStorage.setItem('order_completed', 'true');
    }
    
    console.log('Order created successfully:', data);
    return data;
  } catch (error) {
    console.error('Order creation error:', error);
    throw error;
  }
}

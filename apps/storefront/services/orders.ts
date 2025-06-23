import { Order, OrdersResponse, OrderStatus } from '@/lib/types/order';
import axios from '../lib/api';

const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3006/api/v1';

// Helper function to get the auth token
function getAuthToken(): string | null {
  // Check for token in localStorage first
  const token = localStorage.getItem('token') || 
                localStorage.getItem('accessToken') ||
                // Then check cookies
                document.cookie
                  .split('; ')
                  .find(row => row.startsWith('token=') || row.startsWith('accessToken='))
                  ?.split('=')[1];
  
  return token || null;
}

// Helper function to handle API response status codes
async function handleApiResponse<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any): Promise<T> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${ORDER_SERVICE_URL}${url}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok && response.status !== 201) {
      const errorData = await response.json();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `Failed to ${method.toLowerCase()} order`);
    }

    return response.json();
  } catch (error: any) {
    console.error(`API ${method} request to ${url} failed:`, error);
    throw error;
  }
}

export interface OrderFilters {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export async function getOrders(
  page = 1, 
  limit = 10,
  filters?: OrderFilters
): Promise<{ 
  data: Order[], 
  meta: { 
    total: number, 
    totalPages: number, 
    page: number, 
    limit: number 
  } 
}> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  // Add filters separately with logging
  if (filters?.status) {
    console.log('Status filter value:', filters.status);
    queryParams.append('status', filters.status);
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  if (filters?.sort) {
    queryParams.append('sort', filters.sort);
  }
  if (filters?.order) {
    queryParams.append('order', filters.order);
  }

  const url = `/public/orders?${queryParams}`;
  console.log('Full request URL:', `${ORDER_SERVICE_URL}${url}`);
  console.log('Auth Token:', getAuthToken() ? 'Present' : 'Missing');
  
  try {
    const response = await handleApiResponse<OrdersResponse>(url, 'GET');
    console.log('Orders API Response:', response);
    return response;
  } catch (error: any) {
    // If authentication error, clear any stored tokens
    if (error.message.includes('Authentication required') || error.message.includes('unauthorized')) {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      // Could also clear cookies if needed
    }
    console.error('API Error Details:', error);
    throw error;
  }
}

export async function getOrderById(orderId: string): Promise<Order> {
  return handleApiResponse<Order>(`/public/orders/${orderId}`, 'GET');
}

export async function cancelOrder(orderId: string, reason: string): Promise<Order> {
  return handleApiResponse<Order>(`/orders/${orderId}/cancel`, 'POST', { reason });
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

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  return handleApiResponse<Order>(`/orders/${orderId}/status`, 'PUT', { status });
}

export async function createOrderFromCheckout(checkoutSessionId: string): Promise<Order> {
  try {
    const order = await handleApiResponse<Order>('/orders/checkout', 'POST', { checkoutSessionId });
    
    // Save order ID to localStorage to ensure we can redirect to it
    if (order?.id) {
      localStorage.setItem('last_order_id', order.id);
      localStorage.setItem('order_completed', 'true');
    }
    
    return order;
  } catch (error) {
    console.error('Order creation error:', error);
    throw error;
  }
}

// New methods for additional functionality
export async function getOrderHistory(userId: string): Promise<Order[]> {
  return handleApiResponse<Order[]>(`/orders/history/${userId}`, 'GET');
}

export async function reorder(orderId: string): Promise<Order> {
  return handleApiResponse<Order>(`/orders/${orderId}/reorder`, 'POST');
}

export async function addOrderNote(orderId: string, note: string): Promise<void> {
  return handleApiResponse<void>(`/orders/${orderId}/notes`, 'POST', { note });
}

export async function getOrderNotes(orderId: string): Promise<{ id: string; note: string; createdAt: string }[]> {
  return handleApiResponse<{ id: string; note: string; createdAt: string }[]>(`/orders/${orderId}/notes`, 'GET');
}

// Function to fetch orders with pagination and filtering that matches the interface used in orders/page.tsx
export async function fetchOrders({ 
  page = 1, 
  pageSize = 10, 
  status = [] 
}: { 
  page: number; 
  pageSize: number; 
  status?: string[] 
}) {
  const filters: OrderFilters = {};
  
  // Convert status array to single status if needed
  if (status && status.length > 0) {
    filters.status = status[0] as OrderStatus;
  }
  
  const response = await getOrders(page, pageSize, filters);
  
  return {
    orders: response.data,
    pagination: {
      totalPages: response.meta.totalPages,
      currentPage: response.meta.page,
      hasPrevious: response.meta.page > 1,
      hasMore: response.meta.page < response.meta.totalPages
    }
  };
}

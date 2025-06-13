import { Order, OrdersResponse } from '@/lib/types/order';

const API_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3006/api/va';

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

  const response = await fetch(`${API_URL}/api/orders?${searchParams.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }

  return response.json();
}

export async function cancelOrder(orderId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to cancel order');
  }
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
  const response = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create order');
  }

  return response.json();
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update order status');
  }

  return response.json();
}

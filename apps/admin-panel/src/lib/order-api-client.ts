import { Order, OrderItem, OrderNote, OrderStatus, PaginationOptions, OrderFilters } from '@/types/orders';

// Helper function to get auth headers
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    
    // Handle auth errors
    if (response.status === 401) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnUrl=${returnUrl}`;
      throw new Error(error.message || 'Authentication failed');
    }
    
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return response.json();
};

export const orderApi = {
  // List orders with filtering
  listOrders: async (
    filters: OrderFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ orders: Order[]; pagination: any }> => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...(pagination.sortBy && { sortBy: pagination.sortBy }),
      ...(pagination.order && { order: pagination.order }),
    });

    // Add filters to query string
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    if (filters.search) params.append('search', filters.search);
    
    try {
      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        orders: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: pagination.page || 1,
          pageSize: pagination.limit || 10,
          hasMore: false,
          hasPrevious: false
        }
      };
    }
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Order> => {
    const response = await fetch(`/api/orders/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update order status
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  // Cancel order
  cancelOrder: async (id: string, reason: string): Promise<Order> => {
    const response = await fetch(`/api/orders/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(response);
  },

  // Add a note to an order
  addOrderNote: async (orderId: string, content: string, isInternal = true): Promise<OrderNote> => {
    const response = await fetch(`/api/orders/${orderId}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, isInternal })
    });
    return handleResponse(response);
  },

  // Export orders to CSV
  exportOrders: async (filters: OrderFilters = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`/api/orders/export?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }
    
    return response.blob();
  },

  // Delete order
  deleteOrder: async (id: string): Promise<void> => {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(response);
  },

  // Bulk delete orders
  bulkDeleteOrders: async (ids: string[]): Promise<void> => {
    const response = await fetch('/api/orders/bulk-delete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderIds: ids })
    });
    await handleResponse(response);
  },
  
  // Bulk update order status
  bulkUpdateOrderStatus: async (ids: string[], status: OrderStatus): Promise<void> => {
    const response = await fetch('/api/orders/bulk-update', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        orderIds: ids,
        updates: { status }
      })
    });
    await handleResponse(response);
  }
}; 
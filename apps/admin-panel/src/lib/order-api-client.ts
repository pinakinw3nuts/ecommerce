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
    // Check if we have multiple status values
    if (filters.status && filters.status.includes(',')) {
      // Split status values
      const statusValues = filters.status.split(',');
      let allOrders: Order[] = [];
      let totalOrders = 0;
      
      // Make separate API calls for each status value
      for (const status of statusValues) {
        const modifiedFilters = { ...filters, status };
        const result = await orderApi.listOrders(modifiedFilters, pagination);
        allOrders = [...allOrders, ...result.orders];
        totalOrders += result.pagination.total;
      }
      
      // Sort the combined results according to the original sort criteria
      if (pagination.sortBy) {
        allOrders = allOrders.sort((a: any, b: any) => {
          const valA = a[pagination.sortBy as keyof Order];
          const valB = b[pagination.sortBy as keyof Order];
          
          if (pagination.order?.toUpperCase() === 'DESC') {
            return valA > valB ? -1 : valA < valB ? 1 : 0;
          } else {
            return valA < valB ? -1 : valA > valB ? 1 : 0;
          }
        });
      }
      
      // Apply pagination to the combined results
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedOrders = allOrders.slice(startIndex, endIndex);
      
      return {
        orders: paginatedOrders,
        pagination: {
          total: totalOrders,
          page: pagination.page,
          limit: pagination.limit,
          pages: Math.ceil(totalOrders / pagination.limit)
        }
      };
    }
    
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
    
    // Handle status filter - if comma-separated, use only the first status or remove
    if (filters.status) {
      if (filters.status.includes(',')) {
        // For export, we'll just use the first status value
        const firstStatus = filters.status.split(',')[0];
        params.append('status', firstStatus);
      } else {
        params.append('status', filters.status);
      }
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
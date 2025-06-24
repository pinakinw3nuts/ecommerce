import { Order, OrderItem, OrderNote, OrderStatus, PaginationOptions, OrderFilters } from '@/types/orders';

// Helper function to get auth headers
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Extended params interface for internal use
interface ExtendedOrderFilters extends OrderFilters {
  includeDetails?: boolean;
}

export class OrderService {
  async listOrders(
    filters: ExtendedOrderFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ orders: Order[]; pagination: any }> {
    const queryParams = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...(pagination.sortBy && { sortBy: pagination.sortBy }),
      ...(pagination.order && { order: pagination.order }),
    });

    // Add filters to query string
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
    if (filters.minAmount) queryParams.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount.toString());
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.includeDetails !== undefined) queryParams.append('includeDetails', filters.includeDetails.toString());

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `/api/orders${queryString}`;
    
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to fetch orders: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in listOrders:', error);
      throw error;
    }
  }
  
  async getOrderById(id: string): Promise<Order> {
    const url = `/api/orders/${id}`;
    
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to fetch order: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getOrderById:', error);
      throw error;
    }
  }
  
  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const url = `/api/orders/${id}/status`;
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to update order status: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw error;
    }
  }
  
  async cancelOrder(id: string, reason: string): Promise<Order> {
    const url = `/api/orders/${id}/cancel`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to cancel order: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in cancelOrder:', error);
      throw error;
    }
  }
  
  async addOrderNote(orderId: string, content: string, isInternal = true): Promise<OrderNote> {
    const url = `/api/orders/${orderId}/notes`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, isInternal }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to add note to order: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in addOrderNote:', error);
      throw error;
    }
  }
  
  async exportOrders(filters: OrderFilters = {}): Promise<Blob> {
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const url = `/api/orders/export${queryString}`;
    
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to export orders: ${response.status} ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error in exportOrders:', error);
      throw error;
    }
  }
  
  async deleteOrder(id: string): Promise<void> {
    const url = `/api/orders/${id}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to delete order: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in deleteOrder:', error);
      throw error;
    }
  }
  
  async bulkDeleteOrders(ids: string[]): Promise<void> {
    const url = `/api/orders/bulk-delete`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderIds: ids }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to bulk delete orders: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in bulkDeleteOrders:', error);
      throw error;
    }
  }
  
  async bulkUpdateOrders(ids: string[], updates: { status: OrderStatus }): Promise<void> {
    const url = `/api/orders/bulk-update`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderIds: ids, updates }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to bulk update orders: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in bulkUpdateOrders:', error);
      throw error;
    }
  }
}

// Create a singleton instance for convenience
export const orderService = new OrderService(); 
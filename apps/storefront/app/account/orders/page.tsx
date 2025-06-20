'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils';
import * as orderService from '@/services/orders';
import { Order, OrderStatus } from '@/lib/types/order';

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [meta, setMeta] = useState<{ total: number; totalPages: number; page: number; limit: number } | null>(null);
  const [filters, setFilters] = useState({
    status: undefined as OrderStatus | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    sort: 'createdAt',
    order: 'DESC' as 'ASC' | 'DESC'
  });
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await orderService.getOrders(page, 10, filters);
        setOrders(prev => page === 1 ? response.data : [...prev, ...response.data]);
        setMeta(response.meta);
        setHasMore(page < response.meta.totalPages);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
        if (page === 1) setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, filters]);
  
  const handleOrderClick = (orderId: string) => {
    router.push(`/account/orders/${orderId}`);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  const handleReorder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent order click handler
    try {
      const newOrder = await orderService.reorder(orderId);
      router.push(`/account/orders/${newOrder.id}`);
    } catch (err: any) {
      console.error('Error reordering:', err);
      // Show error toast or message
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">Your Orders</h1>
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading your orders...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    const isAuthError = error.toString().includes('Authentication required') || 
                       error.toString().includes('unauthorized');
                       
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">Your Orders</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4">
          <p className="font-medium">
            {isAuthError ? 'Authentication Required' : 'Error loading orders'}
          </p>
          <p className="text-sm">{error.toString()}</p>
          {isAuthError ? (
            <Link 
              href="/login" 
              className="mt-2 inline-block text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Log In
            </Link>
          ) : (
            <button 
              onClick={() => {
                setPage(1);
                setError(null);
              }} 
              className="mt-2 text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Your Orders</h1>
        
        {/* Filter Controls */}
        <div className="flex gap-4">
          <select
            value={filters.status || ''}
            onChange={(e) => {
              const value = e.target.value;
              console.log('Selected status:', value);
              handleFilterChange({ 
                status: value ? value as OrderStatus : undefined 
              });
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">All Statuses</option>
            <option value={OrderStatus.PENDING}>Pending</option>
            <option value={OrderStatus.CONFIRMED}>Confirmed</option>
            <option value={OrderStatus.SHIPPED}>Shipped</option>
            <option value={OrderStatus.DELIVERED}>Delivered</option>
            <option value={OrderStatus.CANCELLED}>Cancelled</option>
            <option value={OrderStatus.FAILED}>Failed</option>
          </select>
          
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange({ 
              sort: e.target.value,
              order: e.target.value === 'totalAmount' ? 'DESC' : filters.order 
            })}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="createdAt">Date</option>
            <option value="totalAmount">Total</option>
            <option value="status">Status</option>
          </select>
          
          <button
            onClick={() => handleFilterChange({ order: filters.order === 'ASC' ? 'DESC' : 'ASC' })}
            className="border rounded px-3 py-1 text-sm"
          >
            {filters.order === 'ASC' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border rounded p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link href="/products" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="border rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOrderClick(order.id)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Order #{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">
                        Placed: {formatDate(new Date(order.createdAt))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatPrice(order.total || 0)}</div>
                      <span className={`text-sm px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{getItemsCount(order.items)}</span> 
                      {order.shippingAddress && (
                        <>
                          shipped to <span className="font-medium">{getShippingName(order.shippingAddress)}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Preview first few items */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {order.items.slice(0, 3).map(item => (
                        <div key={item.productId} className="flex items-center gap-2">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-10 h-10 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-500 text-xs">
                              No img
                            </div>
                          )}
                          <span className="text-sm truncate max-w-[150px]">{item.name}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-sm text-gray-500 self-center">
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 flex justify-between items-center">
                  <button
                    onClick={(e) => handleReorder(order.id, e)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Reorder
                  </button>
                  <Link 
                    href={`/account/orders/${order.id}`} 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Order Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Orders'}
              </button>
            </div>
          )}

          {meta && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {orders.length} of {meta.total} orders
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper functions
function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
    case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-800';
    case OrderStatus.SHIPPED: return 'bg-purple-100 text-purple-800';
    case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
    case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
    case OrderStatus.FAILED: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getItemsCount(items: any[]): string {
  if (!Array.isArray(items)) return '0 items';
  const count = items.reduce((total, item) => total + (item.quantity || 1), 0);
  return count === 1 ? '1 item' : `${count} items`;
}

function getShippingName(address: any): string {
  if (!address) return 'Unknown';
  const parts = [];
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (parts.length === 0) return 'Unknown location';
  return parts.join(', ');
} 
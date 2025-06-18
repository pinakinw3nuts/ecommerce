'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils';
import * as orderService from '@/services/orders';
import { Order } from '@/lib/types/order';

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Use the Next.js API endpoint instead of direct service call for better auth handling
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        if (response.ok) {
          console.log('Orders fetched:', data);
          setOrders(data.orders || []);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to load orders');
        }
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);
  
  // Function to handle order click
  const handleOrderClick = (orderId: string) => {
    router.push(`/account/orders/${orderId}`);
  };

  if (loading) {
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
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">Your Orders</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4">
          <p className="font-medium">Error loading orders</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white border rounded p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link href="/products" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
            Start Shopping
          </Link>
        </div>
      ) : (
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
                      Placed: {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatPrice(order.total)}</div>
                    <span className={`text-sm px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                      {capitalizeFirstLetter(order.status)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{getItemsCount(order.items)}</span> shipped to <span className="font-medium">{getShippingName(order.shippingAddress)}</span>
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
              
              <div className="bg-gray-50 p-3 text-right">
                <Link href={`/account/orders/${order.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Order Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'shipped': return 'bg-purple-100 text-purple-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getItemsCount(items: any[]): string {
  const count = items.reduce((total, item) => total + item.quantity, 0);
  return `${count} item${count !== 1 ? 's' : ''}`;
}

function getShippingName(address: any): string {
  if (!address) return 'Unknown';
  return `${address.firstName} ${address.lastName}`;
} 
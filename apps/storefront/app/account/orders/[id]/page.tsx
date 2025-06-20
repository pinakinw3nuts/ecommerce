'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils';
import * as orderService from '@/services/orders';
import { Order } from '@/lib/types/order';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const data = await orderService.getOrderById(id as string);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4">
          <p className="font-medium">Error loading order</p>
          <p className="text-sm">{error || 'Order not found'}</p>
          <Link 
            href="/account/orders" 
            className="mt-2 inline-block text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Order Details</h1>
        <Link 
          href="/account/orders"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Orders
        </Link>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Order Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold">Order #{order.orderNumber}</h2>
              <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {capitalizeFirstLetter(order.status)}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6 border-b">
          <h3 className="font-medium mb-4">Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start">
                <div className="flex-shrink-0">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h4 className="font-medium">{item.name}</h4>
                  {item.variantName && (
                    <p className="text-sm text-gray-600">{item.variantName}</p>
                  )}
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  <p className="text-sm text-gray-600">{formatPrice(item.price)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b">
          <h3 className="font-medium mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.shippingAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingAmount)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="p-6 border-b">
          <h3 className="font-medium mb-4">Shipping Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Shipping Address</h4>
              <address className="not-italic">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </address>
            </div>
            {order.trackingNumber && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Tracking Information</h4>
                <p className="font-medium">{order.trackingNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Actions */}
        {order.status === 'pending' && (
          <div className="p-6">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this order?')) {
                  orderService.cancelOrder(order.id, 'Cancelled by customer')
                    .then(() => {
                      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
                    })
                    .catch(err => {
                      console.error('Error cancelling order:', err);
                      alert('Failed to cancel order. Please try again.');
                    });
                }
              }}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'shipped': return 'bg-purple-100 text-purple-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
} 
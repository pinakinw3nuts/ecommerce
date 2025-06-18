'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Truck, CreditCard, Package } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import * as orderService from '@/services/orders';
import { Order } from '@/lib/types/order';

export default function OrderDetails() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!params.id) {
        setError('No order ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Use Next.js API endpoint instead of direct service call for better fallbacks
        const response = await fetch(`/api/orders/${params.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error ${response.status}: Failed to fetch order`);
        }
        
        const orderData = await response.json();
        console.log('Order details:', orderData);
        setOrder(orderData);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="text-sm flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded mt-6"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link 
            href="/account/orders"
            className="text-sm flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-6 text-center">
          <h2 className="text-lg font-medium mb-2">Order Not Found</h2>
          <p>{error || 'We could not find the order you are looking for.'}</p>
          <Link href="/account/orders" className="mt-4 inline-block bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
            Return to Your Orders
          </Link>
        </div>
      </div>
    );
  }

  // Group the items by status for better display
  const itemsByStatus = order.items.reduce((acc: Record<string, typeof order.items>, item) => {
    const status = item.status || 'processing';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button and Order Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/account/orders"
          className="text-sm flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
        <span className={`text-sm px-3 py-1 rounded-full ${getStatusBadgeColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>
      
      <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
      <p className="text-gray-600 mt-1">Placed on {formatDate(order.createdAt)}</p>
      
      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-start">
            <Package className="h-5 w-5 text-gray-600 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium">Shipping Address</h3>
              <p className="text-sm text-gray-600 mt-1">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                {order.shippingAddress.address1}<br />
                {order.shippingAddress.address2 && <>{order.shippingAddress.address2}<br /></>}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-start">
            <Truck className="h-5 w-5 text-gray-600 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium">Delivery Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                {getDeliveryMessage(order.status)}
                <br />
                {order.trackingNumber && (
                  <>
                    Tracking: {order.trackingNumber}<br />
                  </>
                )}
                Carrier: {order.shippingCarrier || 'Standard'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-start">
            <CreditCard className="h-5 w-5 text-gray-600 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium">Payment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Status: {capitalizeFirstLetter(order.paymentStatus)}<br />
                Method: {order.paymentMethod || 'Credit Card'}<br />
                Total: {formatPrice(order.total)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Items */}
      <div className="bg-white border rounded-lg overflow-hidden mb-6">
        <div className="border-b bg-gray-50 px-6 py-3">
          <h2 className="font-medium">Order Items</h2>
        </div>
        
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.productId} className="p-4 flex items-center">
              <div className="flex-shrink-0 mr-4">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-gray-400 rounded">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Link 
                  href={`/products/${item.productId}`} 
                  className="font-medium hover:text-blue-600"
                >
                  {item.name}
                </Link>
                <div className="text-sm text-gray-500">
                  SKU: {item.sku || 'N/A'}
                </div>
              </div>
              <div className="text-sm text-gray-600 mr-8">
                {formatPrice(item.price)} × {item.quantity}
              </div>
              <div className="text-right font-medium">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Shipping</span>
            <span>{formatPrice(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Tax</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600 mb-1">
              <span>Discount</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-base mt-2 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-wrap gap-4 mt-6 justify-between">
        <div>
          {order.status === 'pending' || order.status === 'processing' ? (
            <button 
              onClick={() => handleCancelOrder(order.id)}
              className="bg-white border border-red-600 text-red-600 hover:bg-red-50 px-4 py-2 rounded"
            >
              Cancel Order
            </button>
          ) : null}
        </div>
        
        <div>
          <button 
            onClick={() => window.print()}
            className="bg-white border text-gray-600 hover:bg-gray-50 px-4 py-2 rounded"
          >
            Print Order
          </button>
          
          {order.status === 'delivered' && (
            <Link 
              href={`/account/orders/${order.id}/return`}
              className="bg-white border text-blue-600 hover:bg-blue-50 px-4 py-2 rounded ml-2"
            >
              Return Items
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusBadgeColor(status: string): string {
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
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getDeliveryMessage(status: string): string {
  switch (status) {
    case 'pending': return 'Order processing has not started';
    case 'processing': return 'Order is being prepared';
    case 'shipped': return 'Package is on the way';
    case 'delivered': return 'Package has been delivered';
    case 'cancelled': return 'Order has been cancelled';
    default: return 'Status unknown';
  }
}

// Handle cancel order
async function handleCancelOrder(orderId: string) {
  if (!confirm('Are you sure you want to cancel this order?')) {
    return;
  }
  
  try {
    await orderService.cancelOrder(orderId);
    alert('Order cancelled successfully');
    window.location.reload();
  } catch (error) {
    console.error('Error cancelling order:', error);
    alert('Failed to cancel order. Please try again.');
  }
} 
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Truck, Package, ClipboardCheck, Calendar, MapPin, ArrowLeft, Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/utils/formatters';
import Image from 'next/image';
import * as orderService from '@/services/orders';
import { Order, OrderItem, OrderStatus } from '@/lib/types/order';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  useEffect(() => {
    if (!orderId) return;
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
        
        // Clear any completed order flags from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('order_completed');
          localStorage.removeItem('checkout_session_id');
          localStorage.removeItem('last_order_id');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('We could not load your order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);
  
  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(order.id, cancelReason);
      setCancelSuccess(true);
      
      // Show success toast
      toast.success('Order cancelled successfully');
      
      // Refresh order details to show updated status
      const updatedOrder = await orderService.getOrderById(orderId);
      setOrder(updatedOrder);
      
      // Close modal after a short delay
      setTimeout(() => {
        setCancelModalOpen(false);
        setCancelSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Failed to cancel order. Please try again or contact customer support.');
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleReorder = async () => {
    if (!order) return;
    
    try {
      setIsReordering(true);
      const result = await orderService.reorder(order.id);
      toast.success('Items have been added to your cart');
      router.push('/cart');
    } catch (err) {
      console.error('Error reordering:', err);
      toast.error('Failed to reorder items. Please try again.');
    } finally {
      setIsReordering(false);
    }
  };
  
  // Function to check if order can be cancelled
  const canCancel = () => {
    if (!order) return false;
    
    // Only allow cancellation for certain statuses
    const cancelableStatuses = ['placed', 'processing', 'pending'];
    return cancelableStatuses.includes(order.status.toLowerCase());
  };
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl py-12 px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="container mx-auto max-w-5xl py-12 px-4">
        <div className="text-center py-12 space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Order</h1>
          <p className="text-gray-600 max-w-md mx-auto">{error || 'Order not found'}</p>
          <Button onClick={() => router.push('/orders')}>View All Orders</Button>
        </div>
      </div>
    );
  }
  
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const estimatedDeliveryDate = new Date(orderDate);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);
  const formattedDeliveryDate = estimatedDeliveryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Get current order status
  const orderStatus = order.status || 'processing';
  
  // Calculate the step for the progress bar
  const getStepNumber = () => {
    switch (orderStatus.toLowerCase()) {
      case 'placed':
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      case 'completed':
        return 4;
      default:
        return 1;
    }
  };
  
  const currentStep = getStepNumber();
  
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      {/* Order Success Banner */}
      {order.status.toLowerCase() === 'cancelled' ? (
        <div className="mb-8 bg-red-50 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Order Cancelled
          </h1>
          <p className="text-red-600 max-w-md mx-auto">
            This order has been cancelled and will not be processed.
          </p>
        </div>
      ) : (
        <div className="mb-8 bg-green-50 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-green-600 max-w-md mx-auto">
            Your order has been received and is now being processed. You will receive
            an email confirmation shortly.
          </p>
        </div>
      )}
      
      {/* Order Summary Card */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Order Details */}
        <div className="md:col-span-2">
          <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Order #{order.orderNumber || order.id.substring(0, 8)}</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Placed on {formattedDate}</span>
              </div>
            </div>
            
            {/* Order Progress Tracker */}
            <div className="px-6 py-8 border-b">
              <h3 className="font-medium mb-6">Order Progress</h3>
              
              <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 transition-all duration-500"
                  style={{ width: `${(currentStep - 1) * 33.33}%` }}
                ></div>
                
                {/* Steps */}
                <div className="flex justify-between relative">
                  {/* Step 1: Order Placed */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > 1 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <ClipboardCheck className="h-5 w-5" />
                      )}
                    </div>
                    <p className="text-xs mt-2 text-center">Order<br />Placed</p>
                  </div>
                  
                  {/* Step 2: Shipped */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > 2 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <p className="text-xs mt-2 text-center">Order<br />Shipped</p>
                  </div>
                  
                  {/* Step 3: Out for Delivery */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > 3 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Truck className="h-5 w-5" />
                      )}
                    </div>
                    <p className="text-xs mt-2 text-center">Out for<br />Delivery</p>
                  </div>
                  
                  {/* Step 4: Delivered */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep >= 4 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <MapPin className="h-5 w-5" />
                      )}
                    </div>
                    <p className="text-xs mt-2 text-center">Order<br />Delivered</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm">
                <p className="text-blue-700 flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  <span>Estimated delivery: <strong>{formattedDeliveryDate}</strong></span>
                </p>
                {order.trackingNumber && (
                  <p className="mt-2 text-blue-700">
                    Tracking Number: <strong>{order.trackingNumber}</strong>
                  </p>
                )}
              </div>
            </div>
            
            {/* Order Items */}
            <div className="p-6">
              <h3 className="font-medium mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item: OrderItem) => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                    <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0 border">
                      <Image 
                        src={item.image || '/api/placeholder'} 
                        alt={item.name || 'Product image'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.variantName && (
                        <p className="text-sm text-gray-500">{item.variantName}</p>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        {formatPrice(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Order Summary */}
        <div className="md:col-span-1">
          <Card className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-4">
            <div className="p-6 border-b">
              <h3 className="font-bold">Order Summary</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatPrice(order.shippingAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
              
              {/* Shipping Address */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-medium text-sm mb-2">Shipping Address</h4>
                <address className="text-sm text-gray-600 not-italic">
                  {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}<br />
                  {order.shippingAddress?.street}<br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}<br />
                  {order.shippingAddress?.country}
                </address>
              </div>
              
              {/* Payment Information */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-medium text-sm mb-2">Payment Information</h4>
                <p className="text-sm text-gray-600">
                  {order.metadata?.paymentMethod || 'Credit Card'}<br />
                  Status: <span className="text-green-600 font-medium">Paid</span>
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                {canCancel() && (
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel Order
                  </Button>
                )}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  variant="default"
                  onClick={handleReorder}
                  disabled={isReordering}
                >
                  {isReordering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding to Cart...
                    </>
                  ) : (
                    'Reorder'
                  )}
                </Button>
                <Button className="w-full" variant="outline">
                  <Link href="/contact" className="flex items-center justify-center w-full">
                    Need Help with Order
                  </Link>
                </Button>
                <Button className="w-full" variant="outline">
                  <Link href="/products" className="flex items-center justify-center w-full">
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Back Button */}
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.push('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Orders
        </Button>
      </div>
      
      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => setCancelModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={isCancelling}
            >
              <X className="h-5 w-5" />
            </button>
            
            {cancelSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-green-700 mb-2">Order Cancelled Successfully</h3>
                <p className="text-gray-600">Your order has been cancelled and you will receive a confirmation email shortly.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-4">Cancel Order</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Cancellation
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    disabled={isCancelling}
                  >
                    <option value="">Select a reason</option>
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Shipping takes too long">Shipping takes too long</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                {cancelReason === 'Other' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Please specify
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Please tell us why you're cancelling..."
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={isCancelling}
                    ></textarea>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCancelModalOpen(false)}
                    disabled={isCancelling}
                  >
                    Keep Order
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    disabled={isCancelling || !cancelReason}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Order'
                    )}
                  </Button>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                    <div className="flex items-center text-red-700">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

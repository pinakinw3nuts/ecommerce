'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useCheckout } from '@/components/checkout/CheckoutProvider';
import { useCart } from '@/contexts/CartContext';
import useOrderPlacement from '@/hooks/useOrderPlacement';
import { formatPrice } from '@/lib/utils';
import { markOrderCompleted, getOrderCompletionRedirectUrl } from '@/lib/checkout-utils';
import * as checkoutService from '@/services/checkout';
import * as orderService from '@/services/orders';
import toast from 'react-hot-toast';

// Separate the core component logic
function ReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkoutSession, orderPreview } = useCheckout();
  const { clearCart } = useCart();
  const { isPlacingOrder, setIsPlacingOrder, markOrderComplete, resetOrderState } = useOrderPlacement();

  // Reset the order placement state when component mounts
  useEffect(() => {
    // Reset the order state on component mount
    resetOrderState();
  }, [resetOrderState]);

  useEffect(() => {
    // Redirect if checkoutSession or orderPreview is missing
    if (!checkoutSession?.id || !orderPreview) {
      router.push('/checkout/address'); // Or an appropriate error page
    }
  }, [checkoutSession?.id, orderPreview, router]);

  // Return early if missing required parameters
  if (!checkoutSession?.id || !orderPreview) {
    return null;
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isPlacingOrder) return;
    
    // Set submission status to prevent duplicate submissions
    setIsPlacingOrder(true);
    const loadingToast = toast.loading('Processing your order...');
    
    try {
      console.log('Placing order with session ID:', checkoutSession.id);
      console.log('Order service URL:', process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://127.0.0.1:3006/api/v1');
      
      // Try to create order from checkout session
      const createdOrder = await orderService.createOrderFromCheckout(checkoutSession.id);
      
      console.log('Order created successfully:', createdOrder);
      toast.dismiss(loadingToast);
      toast.success('Order placed successfully!');
      
      // Mark order as completed in storage
      markOrderComplete(checkoutSession.id);
      
      // Also mark as completed in checkout utils for better cross-page state
      markOrderCompleted(createdOrder?.id, checkoutSession.id);
      
      // Set cookies for middleware to detect completion
      document.cookie = `order_completed=true; path=/`;
      if (createdOrder?.id) {
        document.cookie = `last_order_id=${createdOrder.id}; path=/`;
      }
      document.cookie = `last_session_id=${checkoutSession.id}; path=/`;
      
      // Clear any checkout data after successful order
      localStorage.removeItem('checkoutData');
      
      // Clear the cart
      try {
        await clearCart();
        console.log('Cart cleared after order placement');
      } catch (cartError) {
        console.error('Failed to clear cart after order:', cartError);
        // Continue with redirect even if cart clear fails
      }

      // Use window.location for a full page navigation to ensure clean redirect
      window.location.href = getOrderCompletionRedirectUrl();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.dismiss(loadingToast);
      
      // Reset submission status on error
      resetOrderState();
      
      // Handle different error scenarios
      if (error.response?.status === 404) {
        toast.error('Order service endpoint not found. Please try again later.');
      } else if (error.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Failed to place order: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Review & Confirm</h1>

      <div className="space-y-4">
        {orderPreview.items.map((item: checkoutService.CartItem) => (
          <div key={item.productId} className="flex items-center gap-4 border-b pb-2">
            <img src={item.metadata?.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded" />
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-600">
                {formatPrice(item.price)} × {item.quantity}
              </div>
            </div>
            <div className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-4 space-y-1 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(orderPreview.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatPrice(orderPreview.shippingCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatPrice(orderPreview.tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-black text-base pt-2">
          <span>Total</span>
          <span>{formatPrice(orderPreview.total)}</span>
        </div>
      </div>

      <div className="mt-6 border-t pt-4 space-y-1 text-sm text-gray-700">
        <h2 className="text-lg font-semibold mb-2">Shipping Details</h2>
        {checkoutSession.shippingAddress && (
          <>
            <div>{checkoutSession.shippingAddress.firstName} {checkoutSession.shippingAddress.lastName}</div>
            <div>{checkoutSession.shippingAddress.street}</div>
            {checkoutSession.shippingAddress.city}, {checkoutSession.shippingAddress.state} {checkoutSession.shippingAddress.zipCode}
            <div>{checkoutSession.shippingAddress.country}</div>
            <div>{checkoutSession.shippingAddress.email}</div>
            <div>{checkoutSession.shippingAddress.phone}</div>
          </>
        )}
        <div className="mt-2">Method: {checkoutSession.shippingMethod?.toUpperCase()}</div>
      </div>

      <div className="mt-6 border-t pt-4 space-y-1 text-sm text-gray-700">
        <h2 className="text-lg font-semibold mb-2">Payment Method</h2>
        <div>{checkoutSession.paymentMethod?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
      </div>

      <form onSubmit={handlePlaceOrder} className="mt-6">
        <button 
          type="submit" 
          id="place-order-button"
          className={`bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded w-full font-medium ${isPlacingOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isPlacingOrder}
        >
          {isPlacingOrder ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}

// Loading fallback
function ReviewPageLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b pb-2">
            <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t pt-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/12 animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageLoading />}>
      <ReviewPageContent />
    </Suspense>
  );
} 
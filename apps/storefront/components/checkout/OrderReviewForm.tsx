import React, { useState } from 'react';
import { CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCheckout } from './CheckoutProvider';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import * as checkoutService from '@/services/checkout';
import * as orderService from '@/services/orders';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export const OrderReviewForm: React.FC = () => {
  const router = useRouter();
  const { shippingAddress, shippingMethod, paymentMethod, orderPreview, checkoutSession, prevStep, createCheckoutSession, clearCheckout } = useCheckout();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof price === 'string' ? parseFloat(price) : price);
  };

  // Check if all required information is available
  const canPlaceOrder = () => {
    return (
      !!checkoutSession?.id &&
      !!shippingAddress &&
      !!shippingMethod &&
      !!paymentMethod &&
      items.length > 0
    );
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder()) {
      toast.error('Missing required information for checkout');
      return;
    }

    try {
      setIsPlacingOrder(true);

      let currentCheckoutSession = checkoutSession;
      if (!currentCheckoutSession?.id) {
        // If no session exists, create one
        if (!user?.id) {
            toast.error('User not authenticated. Cannot create checkout session.');
            setIsPlacingOrder(false);
            return;
        }
        const userId = user.id;
        const cartItems = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          metadata: {
            imageUrl: item.imageUrl,
            variant: item.variant,
            sku: item.sku,
          },
        }));
        currentCheckoutSession = await createCheckoutSession(userId, cartItems, undefined); // Pass coupon code if available
        if (!currentCheckoutSession) {
          toast.error('Failed to create checkout session.');
          return;
        }
      }

      // Complete the checkout session (simulated payment)
      await checkoutService.completeCheckoutSession(
        currentCheckoutSession.id,
        `demo_payment_${Date.now()}`
      );

      // Create an order from the checkout session
      const placedOrder = await orderService.createOrderFromCheckout(currentCheckoutSession.id);

      // Clear the cart and checkout state after successful order placement
      await clearCart();
      clearCheckout();

      toast.success('Order placed successfully!');
      router.push(`/orders/${placedOrder.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // If missing required information, redirect to appropriate step
  if (!shippingAddress) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-12">
          <p className="mb-4">Please provide your shipping address first.</p>
          <Button onClick={() => prevStep()}>Go Back</Button>
        </div>
      </CardContent>
    );
  }

  if (!shippingMethod) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-12">
          <p className="mb-4">Please select a shipping method first.</p>
          <Button onClick={() => prevStep()}>Go Back</Button>
        </div>
      </CardContent>
    );
  }

  if (!paymentMethod) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-12">
          <p className="mb-4">Please select a payment method first.</p>
          <Button onClick={() => prevStep()}>Go Back</Button>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      <h2 className="text-xl font-bold mb-6">Review Your Order</h2>
      
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-gray-700">Items</h3>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b pb-4">
            <img 
              src={item.imageUrl || '/images/placeholder.jpg'} 
              alt={item.name} 
              className="w-16 h-16 object-cover rounded" 
            />
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              {item.variant && <div className="text-sm text-gray-500">{item.variant}</div>}
              <div className="text-sm text-gray-600">
                {formatPrice(item.price)} × {item.quantity}
              </div>
            </div>
            <div className="font-medium">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{orderPreview ? formatPrice(orderPreview.subtotal) : formatPrice(0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{orderPreview ? formatPrice(orderPreview.shippingCost) : formatPrice(0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{orderPreview ? formatPrice(orderPreview.tax) : formatPrice(0)}</span>
          </div>
          {orderPreview && orderPreview.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(orderPreview.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2">
            <span>Total</span>
            <span>{orderPreview ? formatPrice(orderPreview.total) : formatPrice(0)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Shipping Information</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="text-sm">
            <p className="font-medium">
              {shippingAddress?.firstName} {shippingAddress?.lastName}
            </p>
            <p>{shippingAddress?.street}</p>
            <p>
              {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.zipCode}
            </p>
            <p>{shippingAddress?.country}</p>
            <p>{shippingAddress?.phone}</p>
            <p>{shippingAddress?.email}</p>
            <p className="mt-2">
              <span className="font-medium">Shipping Method: </span> 
              {shippingMethod}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Payment Method</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm capitalize">
            {paymentMethod?.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={isPlacingOrder}
        >
          Back
        </Button>
        <Button 
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder || !canPlaceOrder()}
          className="bg-green-700 hover:bg-green-800"
        >
          {isPlacingOrder ? 'Processing...' : 'Place Order'}
        </Button>
      </div>
    </CardContent>
  );
}; 
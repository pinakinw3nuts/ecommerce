import React, { useState } from 'react';
import { CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCheckout } from './CheckoutProvider';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/utils/formatters';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as checkoutService from '@/services/checkout';
import * as orderService from '@/services/orders';
import Image from 'next/image';
import { Check, AlertTriangle, Loader2, ShoppingCart } from 'lucide-react';

// Extended CartItem type to include productSnapshot
interface ExtendedCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  additionalImages?: string[];
  variant?: string;
  variantId?: string;
  variantName?: string;
  description?: string;
  sku?: string;
  inStock?: boolean;
  brand?: {
    id?: string;
    name?: string;
    logoUrl?: string;
  };
  category?: {
    id?: string;
    name?: string;
  };
  attributes?: {
    [key: string]: string | number | boolean;
  };
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  originalPrice?: number;
  salePrice?: number;
  slug?: string;
  productSnapshot?: {
    name?: string;
    imageUrl?: string;
    variantName?: string;
    [key: string]: any;
  };
}

export const OrderReviewNew: React.FC = () => {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { 
    shippingAddress, 
    shippingMethod, 
    paymentMethod, 
    orderPreview, 
    prevStep, 
    checkoutSession, 
    isPlacingOrder, 
    setIsPlacingOrder,
    createCheckoutSession,
    clearCheckout,
    saveCheckoutState
  } = useCheckout();
  
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [processSteps, setProcessSteps] = useState<{
    checkingInventory: boolean;
    processingPayment: boolean;
    creatingOrder: boolean;
    completed: boolean;
  }>({
    checkingInventory: false,
    processingPayment: false,
    creatingOrder: false,
    completed: false
  });

  const canPlaceOrder = () => {
    return (
      !!shippingAddress &&
      !!shippingMethod &&
      !!paymentMethod &&
      !isPlacingOrder &&
      items.length > 0
    );
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder()) {
      return;
    }

    setIsPlacingOrder(true);
    setSubmissionErrors([]);
    
    // Set localStorage flag to prevent cart redirect loops
    if (typeof window !== 'undefined') {
      localStorage.setItem(checkoutService.ORDER_SUBMISSION_KEY, 'submitting');
      // Save checkout state in case of browser issues
      saveCheckoutState();
    }

    try {
      // Start the processing steps with visual indicators
      setProcessSteps(prev => ({ ...prev, checkingInventory: true }));
      
      // Simulate inventory check (this would be a real check in production)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessSteps(prev => ({ ...prev, checkingInventory: false, processingPayment: true }));

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
          imageUrl: item.imageUrl,
          additionalImages: item.additionalImages,
          variant: item.variant,
          variantId: item.variantId,
          variantName: item.variantName,
          description: item.description,
          sku: item.sku,
          inStock: item.inStock,
          brand: item.brand,
          category: item.category,
          attributes: item.attributes,
          dimensions: item.dimensions,
          originalPrice: item.originalPrice,
          salePrice: item.salePrice,
          slug: item.slug,
          metadata: {
            imageUrl: item.imageUrl,
            variant: item.variant,
            sku: item.sku,
            variantName: item.variantName
          },
        }));
        currentCheckoutSession = await createCheckoutSession(userId, cartItems, undefined); // Pass coupon code if available
        if (!currentCheckoutSession) {
          toast.error('Failed to create checkout session.');
          setSubmissionErrors(['Session creation failed. Please try again.']);
          return;
        }
      }

      // Process payment - in this demo we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Complete the checkout session with payment info
      await checkoutService.completeCheckoutSession(
        currentCheckoutSession.id,
        `demo_payment_${Date.now()}`
      );
      
      setProcessSteps(prev => ({ ...prev, processingPayment: false, creatingOrder: true }));

      // Create an order from the checkout session
      const placedOrder = await orderService.createOrderFromCheckout(currentCheckoutSession.id);
      
      // Mark the process as complete
      setProcessSteps(prev => ({ ...prev, creatingOrder: false, completed: true }));
      
      // Clear the cart and checkout state after successful order placement
      await clearCart();
      
      // Save order data to localStorage for confirmation page
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_order_id', placedOrder.id);
        localStorage.setItem('last_session_id', currentCheckoutSession.id);
        localStorage.setItem('order_completed', 'true');
        // Clear submission status
        localStorage.removeItem(checkoutService.ORDER_SUBMISSION_KEY);
      }
      
      toast.success('Order placed successfully!');
      
      // Allow the completion state to be visible briefly before redirecting
      setTimeout(() => {
        clearCheckout();
        router.push(`/orders/${placedOrder.id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error placing order:', error);
      setSubmissionErrors([
        'Failed to place order. Please try again.',
        error instanceof Error ? error.message : 'Unknown error occurred'
      ]);
      toast.error('Failed to place order. Please try again.');
      
      // Reset processing steps
      setProcessSteps({
        checkingInventory: false,
        processingPayment: false,
        creatingOrder: false,
        completed: false
      });
      
      // Clear submission status
      if (typeof window !== 'undefined') {
        localStorage.removeItem(checkoutService.ORDER_SUBMISSION_KEY);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // If missing required information, redirect to appropriate step
  if (!shippingAddress) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="mb-4 text-lg">Please provide your shipping address first.</p>
          <Button onClick={() => prevStep()}>Go Back</Button>
        </div>
      </CardContent>
    );
  }

  if (!shippingMethod) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="mb-4 text-lg">Please select a shipping method first.</p>
          <Button onClick={() => prevStep()}>Go Back</Button>
        </div>
      </CardContent>
    );
  }

  if (!paymentMethod) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="mb-4 text-lg">Please select a payment method first.</p>
          <Button onClick={() => prevStep()}>Go Back</Button>
        </div>
      </CardContent>
    );
  }
  
  // If order placement is in progress, show processing UI
  if (isPlacingOrder) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-6">Processing Your Order</h2>
          
          <div className="max-w-md mx-auto">
            {/* Processing steps */}
            <div className="space-y-6 mb-8">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  processSteps.checkingInventory 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {processSteps.checkingInventory ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Checking inventory</p>
                  <p className="text-sm text-gray-500">Verifying item availability</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  !processSteps.processingPayment
                    ? 'bg-gray-100 text-gray-400'
                    : processSteps.processingPayment && !processSteps.creatingOrder
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {processSteps.processingPayment && !processSteps.creatingOrder ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : processSteps.creatingOrder || processSteps.completed ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">2</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${!processSteps.processingPayment && !processSteps.creatingOrder ? 'text-gray-400' : ''}`}>
                    Processing payment
                  </p>
                  <p className="text-sm text-gray-500">Securing your transaction</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  !processSteps.creatingOrder
                    ? 'bg-gray-100 text-gray-400'
                    : processSteps.creatingOrder && !processSteps.completed
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {processSteps.creatingOrder && !processSteps.completed ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : processSteps.completed ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">3</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${!processSteps.creatingOrder ? 'text-gray-400' : ''}`}>
                    Creating your order
                  </p>
                  <p className="text-sm text-gray-500">Finalizing order details</p>
                </div>
              </div>
            </div>
            
            {/* Processing message */}
            <p className="text-gray-600 mb-4">
              {processSteps.completed 
                ? 'Order successfully placed! Redirecting you to order confirmation...' 
                : 'Please do not close this window or refresh the page while your order is being processed.'}
            </p>
            
            {/* Show errors if any */}
            {submissionErrors.length > 0 && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mt-4">
                <p className="font-medium">We encountered the following errors:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {submissionErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border">
              <Image 
                src={item.imageUrl || (item.productSnapshot?.imageUrl as string) || '/api/placeholder'} 
                alt={item.name || (item.productSnapshot?.name as string) || 'Product image'}
                width={64}
                height={64}
                className="object-cover"
                unoptimized
                onError={(e) => {
                  // Handle image loading error by setting a fallback
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite fallback loop
                  target.src = '/api/placeholder';
                }}
              />
            </div>
            <div className="flex-1">
              <div className="font-medium">{item.name || (item.productSnapshot?.name as string) || 'Unknown Product'}</div>
              {(item.variantName || item.productSnapshot?.variantName) && (
                <div className="text-sm text-gray-500">{item.variantName || item.productSnapshot?.variantName}</div>
              )}
              {(item.variant && !item.variantName && !item.productSnapshot?.variantName) && (
                <div className="text-sm text-gray-500">{item.variant}</div>
              )}
              {item.sku && (
                <div className="text-xs text-gray-400">SKU: {item.sku}</div>
              )}
              {item.brand?.name && (
                <div className="text-xs text-gray-400">Brand: {item.brand.name}</div>
              )}
              <div className="text-sm text-gray-600 mt-1">
                {item.originalPrice && item.originalPrice > item.price ? (
                  <span>
                    <span className="line-through text-gray-400 mr-1">{formatPrice(item.originalPrice)}</span>
                    {formatPrice(item.price)}
                  </span>
                ) : (
                  formatPrice(item.price)
                )}
                {' × '}{item.quantity}
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
          <div className="text-sm">
            <p className="font-medium">{paymentMethod}</p>
            <p className="text-gray-500 mt-1">
              Payment will be processed securely when you place your order.
            </p>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="mb-6 text-sm text-gray-600">
        <p>
          By placing this order, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:gap-3">
        <Button 
          variant="outline"
          onClick={() => prevStep()}
          className="mt-3 sm:mt-0"
        >
          Back to Payment
        </Button>
        
        <Button
          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          onClick={handlePlaceOrder}
          disabled={!canPlaceOrder()}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Place Order Now
        </Button>
      </div>
      
      {/* Error messages */}
      {submissionErrors.length > 0 && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mt-6">
          <p className="font-medium">We encountered the following errors:</p>
          <ul className="list-disc list-inside mt-2 text-sm">
            {submissionErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            Please try again or contact customer support if the problem persists.
          </p>
        </div>
      )}
    </CardContent>
  );
}; 
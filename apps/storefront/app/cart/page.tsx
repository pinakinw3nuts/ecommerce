'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Plus, Minus, X, Tag, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import CouponForm from '@/components/coupon/CouponForm';
import AppliedCoupon from '@/components/coupon/AppliedCoupon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

// Extended CartItem type to include productSnapshot
interface ExtendedCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variant?: string;
  variantId?: string;
  variantName?: string;
  description?: string;
  sku?: string;
  productSnapshot?: {
    name?: string;
    imageUrl?: string;
    variantName?: string;
    [key: string]: any;
  };
}

export default function CartPage() {
  const { 
    cartId,
    items: cartItems, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    shipping, 
    tax,
    discount,
    total, 
    isEmpty,
    coupon,
    applyCoupon,
    removeCoupon,
    couponLoading,
    couponError,
    loading,
    error,
    refreshCart,
    clearCart
  } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const { showToast } = useToast();
  
  // Cast items to ExtendedCartItem type
  const items = cartItems as ExtendedCartItem[];

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Check if there's a recently completed order and redirect to success page
    const checkForOrderCompletion = () => {
      if (typeof window !== 'undefined') {
        const orderCompleted = localStorage.getItem('order_completed') === 'true';
        const preventRedirect = sessionStorage.getItem('prevent_cart_redirect') === 'true';
        
        if (orderCompleted || preventRedirect) {
          // Get redirect URL based on stored order/session IDs
          const redirectUrl = '/checkout/success';
          
          const orderId = localStorage.getItem('last_order_id');
          const sessionId = localStorage.getItem('last_session_id') || localStorage.getItem('checkout_session_id');
          
          let fullUrl = redirectUrl;
          const params = new URLSearchParams();
          
          if (orderId) {
            params.set('orderId', orderId);
          }
          
          if (sessionId) {
            params.set('sessionId', sessionId);
          }
          
          if (params.toString()) {
            fullUrl += `?${params.toString()}`;
          }
          
          // Navigate to the success page
          window.location.href = fullUrl;
        }
      }
    };
    
    checkForOrderCompletion();
  }, []);

  // Handle item quantity update with debounce
  const handleQuantityUpdate = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setUpdatingItem(itemId);
    try {
      await updateQuantity(itemId, quantity);
      // No toast on success to avoid too many notifications
    } catch (error) {
      showToast({
        message: "Failed to update quantity. Please try again.",
        type: "error"
      });
    } finally {
      setUpdatingItem(null);
    }
  };

  // Handle item removal with confirmation
  const handleRemoveItem = async (itemId: string, itemName: string) => {
    try {
      await removeItem(itemId);
      showToast({
        message: `${itemName} has been removed from your cart.`,
        type: "cart"
      });
    } catch (error) {
      showToast({
        message: "Failed to remove item. Please try again.",
        type: "error"
      });
    }
  };

  // Handle clearing the entire cart
  const handleClearCart = async () => {
    try {
      await clearCart();
      showToast({
        message: "Your cart has been cleared.",
        type: "cart"
      });
    } catch (error) {
      showToast({
        message: "Failed to clear cart. Please try again.",
        type: "error"
      });
    }
  };

  // Render loading state until client-side rendering is available
  if (!isClient) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="h-40 flex items-center justify-center">
          <div className="animate-pulse">Loading cart...</div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching cart data
  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="hidden md:grid grid-cols-12 p-4 border-b bg-gray-50 text-sm font-medium text-gray-500">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>
              
              <div className="divide-y">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                      <Skeleton className="h-20 w-20 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                    <div className="hidden md:block md:col-span-2 text-center">
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </div>
                    <div className="col-span-8 md:col-span-2 flex justify-center">
                      <Skeleton className="h-8 w-24" />
                    </div>
                    <div className="hidden md:block md:col-span-2 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Apply Coupon</h3>
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error loading the cart
  if (error && !loading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-red-800">Unable to load your cart</h3>
          <p className="mb-4 text-red-700">{error}</p>
          <p className="mb-4 text-sm text-red-600">
            We're experiencing temporary issues connecting to our cart service. 
            This may be because our services are starting up or because of a temporary network issue.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => refreshCart()} className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isEmpty) {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart size={64} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Link href="/products" passHref>
              <Button size="lg" className="px-8">
                Continue Shopping
              </Button>
              </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">We encountered an error with your cart</p>
            <p className="text-sm mt-1">{error}. <button onClick={() => refreshCart()} className="underline">Try refreshing</button>.</p>
          </div>
        </div>
      )}
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
          <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="hidden md:grid grid-cols-12 p-4 border-b bg-gray-50 text-sm font-medium text-gray-500">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>
              
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="p-4 grid grid-cols-12 gap-4 items-center">
                    {/* Product */}
                    <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 rounded border overflow-hidden">
                        <Image 
                        src={item.imageUrl || (item.productSnapshot?.imageUrl as string) || '/api/placeholder'} 
                          alt={item.name || 'Product image'}
                          fill
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
                      <div>
                      <h3 className="font-medium">
                        {item.name || (item.productSnapshot?.name as string) || 'Unknown Product'}
                      </h3>
                      {(item.variantName || item.productSnapshot?.variantName) && (
                        <p className="text-sm text-gray-500">{item.variantName || item.productSnapshot?.variantName}</p>
                      )}
                      {(item.variant && !item.variantName && !item.productSnapshot?.variantName) && (
                          <p className="text-sm text-gray-500">{item.variant}</p>
                        )}
                        <button 
                        onClick={() => handleRemoveItem(item.id, item.name || 'Item')}
                        className="text-red-500 hover:text-red-700 text-xs mt-1 flex items-center"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                    
                  {/* Price */}
                  <div className="col-span-4 md:col-span-2 flex md:block">
                    <span className="text-xs text-gray-500 mr-2 md:hidden">Price:</span>
                    <span>{formatPrice(item.price)}</span>
                    </div>
                    
                  {/* Quantity */}
                  <div className="col-span-4 md:col-span-2">
                    <div className="flex items-center justify-center">
                          <button
                        className="w-8 h-8 flex items-center justify-center border rounded-l bg-gray-50 hover:bg-gray-100"
                        onClick={() => handleQuantityUpdate(item.id, Math.max(1, item.quantity - 1))}
                        disabled={updatingItem === item.id}
                      >
                        <Minus className="h-3 w-3" />
                          </button>
                          <input 
                            type="number" 
                        min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityUpdate(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 h-8 text-center border-t border-b"
                            disabled={updatingItem === item.id}
                          />
                          <button
                        className="w-8 h-8 flex items-center justify-center border rounded-r bg-gray-50 hover:bg-gray-100"
                            onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                        disabled={updatingItem === item.id}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {updatingItem === item.id && (
                        <RefreshCw className="h-4 w-4 ml-2 animate-spin text-blue-500" />
                      )}
                    </div>
                  </div>
                  
                  {/* Subtotal */}
                  <div className="col-span-4 md:col-span-2 text-right">
                    <span className="text-xs text-gray-500 mr-2 md:hidden">Subtotal:</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Cart actions */}
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <Button variant="outline" size="sm" onClick={handleClearCart}>
                <X className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
              <Link href="/products" passHref>
                <Button variant="outline" size="sm">
                  Continue Shopping
                </Button>
              </Link>
            </div>
            </div>
          </div>
          
        {/* Order Summary */}
          <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden sticky top-4">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-lg">Order Summary</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Coupon */}
              {coupon ? (
                  <AppliedCoupon 
                    coupon={coupon} 
                    onRemove={removeCoupon}
                  isLoading={couponLoading} 
                  />
              ) : (
                <CouponForm 
                  onApply={applyCoupon}
                  isLoading={couponLoading} 
                  error={couponError} 
                />
              )}
              
              {/* Summary details */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {shipping !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Shipping</span>
                    <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                  </div>
                )}
                {tax !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              
              {/* Checkout button */}
              <div className="pt-4">
                <Link href="/checkout" passHref>
                  <Button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white">
                    Proceed to Checkout
                  </Button>
                </Link>
                
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Check className="text-green-500 h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Your cart will be saved for later</span>
                </div>
                
                {/* Payment methods */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 text-center">We Accept</p>
                  <div className="flex justify-center space-x-2">
                    <Image src="/images/payment/visa.svg" alt="Visa" width={32} height={20} />
                    <Image src="/images/payment/mastercard.svg" alt="Mastercard" width={32} height={20} />
                    <Image src="/images/payment/paypal.svg" alt="PayPal" width={32} height={20} />
                    <Image src="/images/payment/apple-pay.svg" alt="Apple Pay" width={32} height={20} />
                  </div>
                </div>
                
                {/* Trust badges */}
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <div className="flex justify-center items-center space-x-3">
                    <div className="text-xs text-gray-500 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Secure Checkout</span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Privacy Protected</span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>24/7 Support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
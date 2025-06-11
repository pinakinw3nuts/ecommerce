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

export default function CartPage() {
  const { 
    cartId,
    items, 
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

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
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

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {isEmpty ? (
        <div className="text-center py-16 space-y-6 border rounded-lg bg-white">
          <div className="flex justify-center">
            <div className="rounded-full bg-neutral-100 p-6">
              <ShoppingCart className="h-12 w-12 text-neutral-400" />
            </div>
          </div>
          <h2 className="text-xl font-medium">Your cart is empty</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Looks like you haven't added anything to your cart yet.
          </p>
          <div className="pt-4">
            <Button
              asChild
              className="bg-[#D23F57] hover:bg-[#b8354a] text-white"
            >
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      ) : (
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
                {items.map((item) => (
                  <div key={item.id} className="p-4 grid grid-cols-12 gap-4 items-center">
                    {/* Product */}
                    <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 rounded border overflow-hidden">
                        <Image 
                          src={item.imageUrl || '/api/placeholder'} 
                          alt={item.name || 'Product image'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-gray-500">{item.variant}</p>
                        )}
                        <button 
                          onClick={() => handleRemoveItem(item.id, item.name)}
                          className="text-[#D23F57] text-sm flex items-center mt-1 md:hidden"
                          disabled={updatingItem === item.id}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* Price - Mobile */}
                    <div className="col-span-4 md:hidden">
                      <div className="text-sm text-gray-500">Price:</div>
                      <div>{formatPrice(item.price)}</div>
                    </div>
                    
                    {/* Price - Desktop */}
                    <div className="hidden md:block md:col-span-2 text-center">
                      {formatPrice(item.price)}
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="col-span-8 md:col-span-2 flex justify-center">
                      <div className="flex items-center">
                        <div className="flex items-center border rounded">
                          <button
                            type="button"
                            className="p-1 hover:bg-gray-100 disabled:opacity-50"
                            onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingItem === item.id}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => handleQuantityUpdate(item.id, parseInt(e.target.value) || 1)}
                            className="w-10 text-center border-0 focus:ring-0"
                            min="1"
                            disabled={updatingItem === item.id}
                          />
                          <button
                            type="button"
                            className="p-1 hover:bg-gray-100 disabled:opacity-50"
                            onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                            disabled={updatingItem === item.id}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {updatingItem === item.id && (
                          <div className="ml-2">
                            <div className="w-4 h-4 border-2 border-t-transparent border-[#D23F57] rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Subtotal - Mobile */}
                    <div className="col-span-12 md:hidden border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Subtotal:</span>
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    
                    {/* Subtotal - Desktop */}
                    <div className="hidden md:block md:col-span-2 text-right font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    
                    {/* Remove - Desktop */}
                    <div className="hidden md:block">
                      <button 
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="text-gray-400 hover:text-[#D23F57] disabled:opacity-50"
                        disabled={updatingItem === item.id}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4">
              <Button
                asChild
                variant="outline"
              >
                <Link href="/products">
                  Continue Shopping
                </Link>
              </Button>
              <Button
                onClick={() => refreshCart()}
                variant="outline"
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Cart
              </Button>
              <Button
                onClick={handleClearCart}
                variant="outline"
                className="inline-flex items-center gap-2 text-[#D23F57] border-[#D23F57] hover:bg-[#D23F57] hover:text-white"
              >
                <X className="h-4 w-4" />
                Clear Cart
              </Button>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            {/* Coupon Code Section */}
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-[#D23F57]" />
                Apply Coupon
              </h3>
              
              {coupon ? (
                <div className="mb-4">
                  <AppliedCoupon 
                    coupon={coupon} 
                    onRemove={removeCoupon}
                  />
                </div>
              ) : (
                <CouponForm 
                  orderTotal={subtotal} 
                  onApply={applyCoupon}
                  compact
                />
              )}
              
              <div className="text-sm text-gray-500 mt-4">
                <Link href="/coupons" className="text-[#D23F57] hover:underline flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  View all available coupons
                </Link>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
              
              <Button
                asChild
                className="w-full bg-[#D23F57] hover:bg-[#b8354a] text-white"
              >
                <Link href="/checkout">
                  Proceed to Checkout
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
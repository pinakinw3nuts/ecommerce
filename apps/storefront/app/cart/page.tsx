'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    shipping, 
    tax, 
    total, 
    isEmpty 
  } = useCart();
  const [isClient, setIsClient] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

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
                          alt={item.name}
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
                          onClick={() => removeItem(item.id)}
                          className="text-[#D23F57] text-sm flex items-center mt-1 md:hidden"
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
                      <div className="flex items-center border rounded">
                        <button
                          className="p-1 hover:bg-gray-100"
                          onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center">{item.quantity}</span>
                        <button
                          className="p-1 hover:bg-gray-100"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
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
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="hidden md:block text-gray-400 hover:text-[#D23F57]"
                    >
                      <X className="h-5 w-5" />
                    </button>
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
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
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
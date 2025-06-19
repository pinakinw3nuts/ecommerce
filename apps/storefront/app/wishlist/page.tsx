'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist, isEmpty } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { showToast } = useToast();

  const handleRemoveItem = (id: string, name: string) => {
    removeItem(id);
    showToast({
      message: `${name} removed from wishlist`,
      type: 'wishlist',
      duration: 3000,
    });
  };

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
    });
    
    showToast({
      message: `${item.name} added to cart`,
      type: 'cart',
      duration: 3000,
    });
  };

  const handleClearWishlist = () => {
    clearWishlist();
    showToast({
      message: 'Wishlist cleared',
      type: 'info',
      duration: 3000,
    });
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-12 w-12 text-neutral-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
          <p className="text-neutral-600 mb-8 max-w-md">
            Browse our products and save your favorites for later
          </p>
          <Link href="/products">
            <Button className="bg-[#D23F57] hover:bg-[#c02c45] text-white">
              Continue Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-6">
            <Button 
              variant="outline" 
              onClick={handleClearWishlist} 
              className="text-sm"
            >
              Clear Wishlist
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row gap-4"
              >
                <div className="relative aspect-square w-full sm:w-32 h-32 flex-shrink-0">
                  <Link href={`/products/${item.slug}`}>
                    <Image
                      src={item.imageUrl || '/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </Link>
                </div>
                
                <div className="flex-grow flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-grow">
                    <Link 
                      href={`/products/${item.slug}`}
                      className="text-lg font-medium hover:text-[#D23F57] transition-colors"
                    >
                      {item.name}
                    </Link>
                    <div className="text-[#D23F57] font-semibold mt-1">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      className="bg-[#D23F57] hover:bg-[#c02c45] text-white"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      aria-label="Remove from wishlist"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 
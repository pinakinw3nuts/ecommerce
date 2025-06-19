'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function AccountWishlistPage() {
  const { items, removeItem, loading, isEmpty } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { showToast } = useToast();

  const handleRemoveItem = async (id: string, name: string) => {
    try {
      await removeItem(id);
      showToast({
        message: `${name} removed from wishlist`,
        type: 'wishlist',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error removing item:', error);
      showToast({
        message: 'Failed to remove item from wishlist',
        type: 'error',
        duration: 3000,
      });
    }
  };

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.productId,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl || item.productImage,
    });
    
    showToast({
      message: `${item.name} added to cart`,
      type: 'cart',
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Your Wishlist</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex gap-4">
                <div className="w-32 h-32 bg-gray-200 rounded-md"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Your Wishlist</h1>

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
        <div className="grid grid-cols-1 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row gap-4"
            >
              <div className="relative aspect-square w-full sm:w-32 h-32 flex-shrink-0">
                <Link href={`/products/${item.slug}`}>
                  <Image
                    src={item.imageUrl || item.productImage || '/placeholder.jpg'}
                    alt={item.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </Link>
              </div>
              
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
                  onClick={() => handleRemoveItem(item.productId, item.name)}
                  aria-label="Remove from wishlist"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
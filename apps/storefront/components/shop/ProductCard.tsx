'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountedPrice?: number | null;
    discountPercentage?: number;
    rating?: number;
    image: string;
  };
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const inWishlist = isInWishlist(product.id);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent the event from bubbling up
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      quantity: 1,
      imageUrl: product.image,
    });
    
    // Show a toast notification
    showToast({
      message: `${product.name} added to cart!`,
      type: 'cart',
      duration: 3000
    });
  };
  
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent the event from bubbling up
    
    if (inWishlist) {
      removeFromWishlist(product.id);
      showToast({
        message: `${product.name} removed from wishlist`,
        type: 'wishlist',
        duration: 3000
      });
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.discountedPrice || product.price,
        imageUrl: product.image,
        slug: product.slug,
      });
      showToast({
        message: `${product.name} added to wishlist!`,
        type: 'wishlist',
        duration: 3000
      });
    }
  };
  
  return (
    <div className={cn(
      "group relative bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow",
      className
    )}>
      <Link 
        href={`/products/${product.slug}`}
        className="block"
      >
        <div className="aspect-square relative overflow-hidden">
          {product.image ? (
            <Image 
              src={product.image}
              alt={product.name}
              width={500}
              height={500}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          
          {product.discountPercentage && product.discountPercentage > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {product.discountPercentage}% OFF
            </span>
          )}
          
          {/* Quick action buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
            <Button 
              onClick={handleAddToCart}
              size="sm"
              variant="secondary" 
              className="flex items-center gap-1"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </Button>
            
            <button
              onClick={handleToggleWishlist}
              className={cn(
                "p-2 rounded-full",
                inWishlist ? "bg-primary text-white" : "bg-white text-gray-800"
              )}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn(
                "h-4 w-4",
                inWishlist ? "fill-white" : "fill-transparent"
              )} />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              {product.discountedPrice ? (
                <>
                  <span className="font-semibold text-primary">
                    {formatPrice(product.discountedPrice)}
                  </span>
                  <span className="text-sm text-gray-500 line-through ml-2">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="font-semibold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            {product.rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
} 
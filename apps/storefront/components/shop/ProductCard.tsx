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
    description?: string;
  };
  priority?: boolean;
  className?: string;
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, priority = false, className, viewMode = 'grid' }: ProductCardProps) {
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
  
  // Render grid or list view based on viewMode prop
  if (viewMode === 'grid') {
    return (
      <div className={cn(
        "group relative bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all",
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
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
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
                  inWishlist ? "bg-red-600 text-white" : "bg-white text-gray-800"
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
            <h3 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                {product.discountedPrice ? (
                  <>
                    <span className="font-semibold text-red-600">
                      {formatPrice(product.discountedPrice)}
                    </span>
                    <span className="text-sm text-gray-500 line-through ml-2">
                      {formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-gray-900">
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
  } else {
    // List view
    return (
      <div className={cn(
        "group relative bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all",
        className
      )}>
        <Link 
          href={`/products/${product.slug}`}
          className="flex flex-col md:flex-row"
        >
          {/* Product image (left side in desktop, top in mobile) */}
          <div className="md:w-1/4 relative">
            <div className="aspect-square md:h-full relative overflow-hidden">
              {product.image ? (
                <Image 
                  src={product.image}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  priority={priority}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              
              {product.discountPercentage && product.discountPercentage > 0 && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                  {product.discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>
          
          {/* Product details (right side in desktop, bottom in mobile) */}
          <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-medium text-lg text-gray-900 group-hover:text-red-600 transition-colors">
                {product.name}
              </h3>
              
              {product.description && (
                <p className="text-gray-600 mt-2 line-clamp-2 text-sm">
                  {product.description || "No description available for this product."}
                </p>
              )}
              
              <div className="flex items-center mt-3">
                {product.rating && (
                  <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-yellow-700 ml-1">{product.rating}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center mb-2 md:mb-0">
                {product.discountedPrice ? (
                  <div className="flex flex-col md:flex-row md:items-center">
                    <span className="font-semibold text-lg text-red-600">
                      {formatPrice(product.discountedPrice)}
                    </span>
                    <span className="text-sm text-gray-500 line-through md:ml-2">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                ) : (
                  <span className="font-semibold text-lg text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleAddToCart}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
                
                <button
                  onClick={handleToggleWishlist}
                  className={cn(
                    "p-2 rounded-full border",
                    inWishlist 
                      ? "bg-red-50 text-red-600 border-red-200" 
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                  aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={cn(
                    "h-4 w-4",
                    inWishlist ? "fill-red-600" : "fill-transparent"
                  )} />
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }
} 
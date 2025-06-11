'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/components/ui/Toast';

interface ProductCardProps {
  title: string;
  price: string;
  imageUrl: string;
  productId: string;
  rating?: number;
  showQuickAdd?: boolean;
}

export default function ProductCard({
  title,
  price,
  imageUrl,
  productId,
  rating = 0,
  showQuickAdd = true,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const isItemInWishlist = isInWishlist(productId);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: productId,
      productId: productId,
      name: title,
      price: parseFloat(price.replace(/[^0-9.]/g, '')),
      quantity: 1,
      imageUrl: imageUrl || '/api/placeholder',
      description: title,
      sku: `SKU-${productId.substring(0, 8)}`,
      inStock: true
    });
    
    showToast({
      message: `${title} added to cart`,
      type: 'cart',
      duration: 3000,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isItemInWishlist) {
      removeFromWishlist(productId);
      showToast({
        message: `${title} removed from wishlist`,
        type: 'wishlist',
        duration: 3000,
      });
    } else {
      addToWishlist({
        id: productId,
        name: title,
        price: parseFloat(price.replace(/[^0-9.]/g, '')),
        imageUrl: imageUrl,
        slug: productId,
      });
      showToast({
        message: `${title} added to wishlist`,
        type: 'wishlist',
        duration: 3000,
      });
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Link 
      href={`/products/${productId}`}
      className="group block relative"
    >
      <div 
        className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {imageError ? (
          <div className="flex items-center justify-center h-full bg-neutral-100 dark:bg-neutral-800">
            <span className="text-neutral-400">Image not available</span>
          </div>
        ) : (
          <Image 
            src={imageUrl} 
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={handleImageError}
          />
        )}

        {/* Wishlist button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-neutral-900 z-10"
          onClick={handleWishlistToggle}
          aria-label={isItemInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${isItemInWishlist ? "fill-red-500 text-red-500" : ""}`} />
        </Button>

        {/* Quick add button - shown on hover */}
        {showQuickAdd && (
          <div className={`absolute bottom-0 left-0 right-0 p-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm transition-transform duration-200 ${
            isHovered ? 'translate-y-0' : 'translate-y-full'
          }`}>
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleQuickAdd}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : i < rating
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'fill-none text-neutral-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-medium text-sm text-neutral-900 dark:text-white truncate">{title}</h3>
        
        {/* Price */}
        <p className="font-semibold text-sm">{price}</p>
      </div>
    </Link>
  );
} 
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@components/ui/Toast';

// Define the Product interface directly in this file
interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  slug: string;
  description?: string;
  sku?: string;
  inStock?: boolean;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
}

interface ProductListItemProps {
  product: Product;
}

export default function ProductListItem({ product }: ProductListItemProps) {
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const isItemInWishlist = isInWishlist(product.id);
  const formattedPrice = `$${product.price.toFixed(2)}`;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const formattedSalePrice = hasDiscount ? `$${product.salePrice?.toFixed(2)}` : null;
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: hasDiscount && product.salePrice ? product.salePrice : product.price,
      quantity: 1,
      imageUrl: product.imageUrl || '/api/placeholder',
      description: product.description || product.name,
      sku: product.sku || `SKU-${product.id.substring(0, 8)}`,
      inStock: product.inStock !== false
    });
    
    showToast({
      message: `${product.name} added to cart`,
      type: 'cart',
      duration: 3000,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isItemInWishlist) {
      removeFromWishlist(product.id);
      showToast({
        message: `${product.name} removed from wishlist`,
        type: 'wishlist',
        duration: 3000,
      });
    } else {
      addToWishlist({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: hasDiscount && product.salePrice ? product.salePrice : product.price,
        imageUrl: product.imageUrl,
        productImage: product.imageUrl,
        variantId: null,
        metadata: {
          slug: product.slug,
          sku: product.sku,
          description: product.description,
          category: product.category,
          brand: product.brand,
          hasDiscount,
          originalPrice: product.price
        },
        slug: product.slug
      });
      showToast({
        message: `${product.name} added to wishlist`,
        type: 'wishlist',
        duration: 3000,
      });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link 
        href={`/products/${product.slug}`}
        className="flex flex-col sm:flex-row h-full"
      >
        {/* Product Image */}
        <div className="w-full sm:w-48 md:w-56 lg:w-64 relative aspect-square sm:aspect-auto sm:h-full flex-shrink-0">
          <Image 
            src={product.imageUrl || '/images/placeholder.jpg'} 
            alt={product.name}
            className="object-cover"
            fill
            sizes="(max-width: 640px) 100vw, 250px"
          />
        </div>
        
        {/* Product Details */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Title and Brand */}
            <div className="mb-2">
              <h3 className="text-lg font-medium">{product.name}</h3>
              {product.brand && (
                <p className="text-sm text-gray-600">Brand: {product.brand}</p>
              )}
            </div>
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : i < (product.rating || 0)
                        ? 'fill-yellow-400/50 text-yellow-400'
                        : 'fill-none text-gray-300'
                    }`}
                  />
                ))}
                {product.reviewCount && (
                  <span className="ml-2 text-sm text-gray-600">
                    ({product.reviewCount} reviews)
                  </span>
                )}
              </div>
            )}
            
            {/* Short Description */}
            {product.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
          
          {/* Price and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4">
            <div className="mb-2 sm:mb-0">
              {hasDiscount ? (
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-red-600 mr-2">
                    {formattedSalePrice}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formattedPrice}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-semibold">{formattedPrice}</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className={`border ${
                  isItemInWishlist
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={handleWishlistToggle}
                aria-label={isItemInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`h-4 w-4 mr-1 ${isItemInWishlist ? "fill-red-500 text-red-500" : ""}`} />
                <span className="hidden sm:inline">
                  {isItemInWishlist ? 'Saved' : 'Save'}
                </span>
              </Button>
              
              <Button
                variant="default"
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                <span>Add to Cart</span>
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
} 
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/Button';

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  const [startIndex, setStartIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  if (!products || products.length === 0) {
    return null;
  }
  
  const visibleProducts = 4; // Number of products visible at once
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + visibleProducts < products.length;
  
  const scrollLeft = () => {
    if (canScrollLeft) {
      setStartIndex(Math.max(0, startIndex - 1));
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollLeft - 300,
          behavior: 'smooth'
        });
      }
    }
  };
  
  const scrollRight = () => {
    if (canScrollRight) {
      setStartIndex(Math.min(products.length - visibleProducts, startIndex + 1));
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollLeft + 300,
          behavior: 'smooth'
        });
      }
    }
  };
  
  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.discountedPrice || product.price,
        imageUrl: product.images[0],
        slug: product.slug
      });
    }
  };

  return (
    <div className="mt-16 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">You Might Also Like</h2>
        <div className="flex gap-2">
          <Button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full ${
              canScrollLeft
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`p-2 rounded-full ${
              canScrollRight
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="grid grid-flow-col auto-cols-[280px] gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const inWishlist = isInWishlist(product.id);
          const discountPercentage = product.price && product.discountedPrice
            ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
            : 0;
            
          return (
            <Link 
              key={product.id} 
              href={`/products/${product.slug}`}
              className="group snap-start"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3 group-hover:shadow-md transition-shadow duration-300">
                <Image
                  src={product.images?.[0] || '/images/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-product.jpg';
                    e.currentTarget.srcset = '/images/placeholder-product.jpg';
                  }}
                />
                
                {/* Discount Badge */}
                {discountPercentage > 0 && (
                  <div className="absolute top-2 left-2 bg-[#D23F57] text-white text-xs font-bold px-2 py-1 rounded">
                    {discountPercentage}% OFF
                  </div>
                )}
                
                {/* Wishlist Button */}
                <button
                  onClick={(e) => handleWishlistToggle(e, product)}
                  className={`absolute top-2 right-2 p-2 rounded-full ${
                    inWishlist
                      ? 'bg-red-50 text-[#D23F57]'
                      : 'bg-white/80 text-gray-600 hover:text-[#D23F57]'
                  } transition-colors shadow-sm`}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <h3 className="font-medium text-gray-900 group-hover:text-[#D23F57] transition-colors truncate">
                {product.name}
              </h3>
              
              <div className="flex items-center mt-1">
                <div className="flex items-center mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(product.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  ({product.numReviews || 0})
                </span>
              </div>
              
              <div className="mt-1 font-medium flex items-baseline gap-2">
                {product.discountedPrice ? (
                  <>
                    <span className="text-[#D23F57]">{formatPrice(product.discountedPrice)}</span>
                    <span className="text-gray-500 line-through text-sm">{formatPrice(product.price)}</span>
                  </>
                ) : (
                  <span>{formatPrice(product.price)}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 
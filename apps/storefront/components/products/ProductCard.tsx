'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  rating?: number;
  discountedPrice?: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link 
      href={`/products/${product.slug}`}
      className="block border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image 
          src={product.image || '/images/placeholder.jpg'} 
          alt={product.name}
          fill
          className="object-cover transition-transform hover:scale-105"
        />
        {product.discountedPrice && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            SALE
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-yellow-400">
              {i < (product.rating || 0) ? '★' : '☆'}
            </span>
          ))}
        </div>
        
        <div className="mt-2">
          {product.discountedPrice ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-red-500">${product.discountedPrice.toFixed(2)}</span>
              <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
            </div>
          ) : (
            <span className="font-semibold text-gray-900">${product.price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
} 
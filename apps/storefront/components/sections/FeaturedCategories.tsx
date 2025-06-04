'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { AspectRatio } from '@/components/ui/aspect-ratio'; // Uncomment if available

interface CategoryType {
  id: string;
  name: string;
  image: string;
  productCount: number;
  slug: string;
}

export default function FeaturedCategories() {
  const categories: CategoryType[] = [
    {
      id: '1',
      name: 'Clothing',
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format',
      productCount: 120,
      slug: 'clothing',
    },
    {
      id: '2',
      name: 'Accessories',
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format',
      productCount: 85,
      slug: 'accessories',
    },
    {
      id: '3',
      name: 'Footwear',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format',
      productCount: 64,
      slug: 'footwear',
    },
    {
      id: '4',
      name: 'Watches',
      image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&auto=format',
      productCount: 42,
      slug: 'watches',
    },
    {
      id: '5',
      name: 'Bags',
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format',
      productCount: 36,
      slug: 'bags',
    },
    {
      id: '6',
      name: 'Beauty',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format',
      productCount: 54,
      slug: 'beauty',
    },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Categories</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Discover our wide selection of products across popular categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                console.log(`Featured category selected: ${category.slug}`);
                
                // Navigate programmatically instead of using direct href
                const url = new URL('/products', window.location.origin);
                
                // Add category parameter
                url.searchParams.set('category', category.slug);
                
                // Reset page to 1 when changing category
                url.searchParams.set('page', '1');
                
                // Log the constructed URL
                console.log(`Navigating to: ${url.toString()}`);
                
                // Navigate to the URL
                window.location.href = url.toString();
              }}
              className="group block"
            >
              <div className="relative rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="aspect-square relative">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <p className="text-sm text-white/80">{category.productCount} products</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 
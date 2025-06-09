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

const featuredCategories = [
  {
    name: 'HAMMER TAILS',
    href: '/shop/hammer-tails',
    image: '/images/categories/hammer-tails.jpg',
    position: 'left'
  },
  {
    name: 'SOPHISTICATED MUSCLE',
    href: '/shop/sophisticated-muscle',
    image: '/images/categories/sophisticated-muscle.jpg',
    position: 'center'
  },
  {
    name: 'HYPERCARS',
    href: '/shop/hypercars',
    image: '/images/categories/hypercars.jpg',
    position: 'right'
  }
];

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
      image: 'https://images.unsplash.com/photo-1590874103328-e08b4cac3105?w=800&auto=format',
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
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredCategories.map((category) => (
            <Link 
              key={category.name} 
              href={category.href}
              className="relative group overflow-hidden h-64 block"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: `url(${category.image})`,
                  backgroundPosition: category.position === 'center' ? 'center' : 
                                      category.position === 'left' ? 'left center' : 'right center'
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-opacity duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-2xl md:text-3xl font-bold tracking-wider">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 
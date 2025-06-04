'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

type Category = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  categorySlug: string;
};

export default function CategoryHighlights() {
  const categories: Category[] = [
    {
      id: 'shoes',
      title: 'Trendy Shoes',
      subtitle: 'From $29.99',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format',
      categorySlug: 'shoes',
    },
    {
      id: 'hats',
      title: 'Stylish Hats',
      subtitle: 'From $19.99',
      image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&auto=format',
      categorySlug: 'hats',
    },
    {
      id: 'jackets',
      title: 'Premium Jackets',
      subtitle: 'From $49.99',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format',
      categorySlug: 'jackets',
    },
  ];

  // Function to handle category navigation
  const handleCategoryNavigation = (categorySlug: string) => {
    console.log(`CategoryHighlights category selected: ${categorySlug}`);
    
    // Navigate programmatically instead of using direct href
    const url = new URL('/products', window.location.origin);
    
    // Add category parameter
    url.searchParams.set('category', categorySlug);
    
    // Reset page to 1 when changing category
    url.searchParams.set('page', '1');
    
    // Log the constructed URL
    console.log(`Navigating to: ${url.toString()}`);
    
    // Navigate to the URL
    window.location.href = url.toString();
  };

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block bg-[#2979FF] text-white px-4 py-2 mb-4 font-bold">
          Shop by Category
        </div>
        <p className="text-gray-600">
          Explore our curated collections for every style and occasion
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div 
            key={category.id}
            className="bg-gray-200 rounded-lg overflow-hidden"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={category.image}
                alt={category.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-white mb-1">{category.title}</h3>
                <p className="text-white mb-4">{category.subtitle}</p>
                <Link href="#" onClick={(e) => {
                  e.preventDefault();
                  handleCategoryNavigation(category.categorySlug);
                }}>
                  <Button 
                    variant="default"
                    className="bg-white text-black hover:bg-white/90 hover:text-black px-6"
                  >
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 
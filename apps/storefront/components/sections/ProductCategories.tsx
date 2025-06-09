"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Define types for our data
interface Product {
  name: string;
  href: string;
  image: string;
}

interface Category {
  id: string;
  name: string;
  image: string;
  products: Product[];
}

export default function ProductCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoriesWithProducts = async () => {
      try {
        setLoading(true);
        // Fetch featured categories
        const categoriesResponse = await axios.get('/api/categories/featured?limit=3');
        
        if (!categoriesResponse.data || !categoriesResponse.data.categories) {
          throw new Error('Invalid categories response format');
        }
        
        // Process each category and fetch its products
        const categoriesWithProducts = await Promise.all(
          categoriesResponse.data.categories.slice(0, 3).map(async (cat: any) => {
            // For each category, fetch its top products
            const productsResponse = await axios.get(
              `/api/products?categoryId=${cat.id || cat._id}&limit=4`
            );
            
            const products = productsResponse.data && productsResponse.data.products 
              ? productsResponse.data.products.map((product: any) => ({
                  name: product.name || 'Product',
                  href: `/products/${product.slug || product.id || ''}`,
                  image: product.mediaUrl || product.image || '/images/placeholder.jpg'
                }))
              : [];
            
            return {
              id: cat.id || cat._id || '',
              name: cat.name || '',
              image: cat.imageUrl || cat.image || '/images/categories/placeholder.jpg',
              products
            };
          })
        );
        
        setCategories(categoriesWithProducts);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories with products:', err);
        setError('Failed to load product categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesWithProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-1 rounded-lg overflow-hidden h-full min-h-[200px] bg-gray-200 animate-pulse"></div>
                
                <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="border border-gray-200 rounded-lg p-3">
                      <div className="aspect-square mb-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {categories.map((category) => (
          <div key={category.id} className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">{category.name}</h2>
              <Link 
                href={`/shop/${category.id}`} 
                className="text-gray-600 hover:text-red-600 flex items-center"
              >
                View All
                <svg 
                  className="ml-1 h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1 bg-cover bg-center rounded-lg overflow-hidden h-full min-h-[200px] relative">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${category.image})` }}
                ></div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <Link 
                    href={`/shop/${category.id}`}
                    className="px-6 py-3 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Shop {category.name}
                  </Link>
                </div>
              </div>
              
              <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {category.products.map((product) => (
                  <Link 
                    key={product.name} 
                    href={product.href}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square mb-3 relative overflow-hidden rounded">
                      <div 
                        className="w-full h-full bg-contain bg-center bg-no-repeat" 
                        style={{ backgroundImage: `url(${product.image})` }}
                      ></div>
                    </div>
                    <h3 className="text-sm text-center font-medium">{product.name}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 
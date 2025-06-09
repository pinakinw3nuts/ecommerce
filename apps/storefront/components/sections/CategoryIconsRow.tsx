"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { API_GATEWAY_URL } from '../../lib/constants';

// Define the Category type locally since we're no longer importing from mockApi
interface Category {
  id: string;
  name: string;
  href: string;
  image: string;
  description?: string;
  productCount?: number;
  featured?: boolean;
}

export default function CategoryIconsRow() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        // Use the API gateway to fetch categories
        const response = await axios.get('/api/categories');
        
        if (!response.data || !response.data.categories) {
          throw new Error('Invalid response format');
        }
        
        // Map the API response to match our component's expected format
        const formattedCategories = response.data.categories.map((cat: any) => ({
          id: cat.id || cat._id || '',
          name: cat.name || '',
          href: `/shop/${cat.slug || cat.id || ''}`,
          image: cat.imageUrl || cat.image || '/images/placeholder.png',
          description: cat.description || '',
          productCount: cat.productCount || 0,
          featured: cat.featured || true
        }));
        
        setCategories(formattedCategories);
        setError(null);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-8 bg-white border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 bg-white border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-white border-t border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex space-x-8 min-w-max">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={category.href}
                className="flex flex-col items-center group"
              >
                <div className="w-24 h-24 mb-2 relative">
                  <div className="w-full h-full flex items-center justify-center">
                    <div 
                      className="w-20 h-20 bg-contain bg-center bg-no-repeat" 
                      style={{ backgroundImage: `url(${category.image})` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-center">{category.name}</span>
                {category.productCount && (
                  <span className="text-xs text-gray-500 mt-1">{category.productCount} products</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* CSS for hiding scrollbar but allowing scroll */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
} 
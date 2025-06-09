"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  productCount?: number;
}

export default function BrandLogos() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/brands?limit=6');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch brands: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.brands && Array.isArray(data.brands)) {
          setBrands(data.brands);
          console.log('Fetched brands:', data.brands);
        } else {
          console.log('No brands found in API response');
          setBrands([]);
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setError('Failed to load brands');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrands();
  }, []);

  // Fallback brands in case API fails
  const fallbackBrands = [
    { id: '1', name: 'BMW', slug: 'bmw', logo: '/images/brands/bmw.png', productCount: 24 },
    { id: '2', name: 'Audi', slug: 'audi', logo: '/images/brands/audi.png', productCount: 18 },
    { id: '3', name: 'Benz', slug: 'benz', logo: '/images/brands/benz.png', productCount: 32 },
    { id: '4', name: 'Jaguar', slug: 'jaguar', logo: '/images/brands/jaguar.png', productCount: 15 },
    { id: '5', name: 'LR', slug: 'lr', logo: '/images/brands/lr.png', productCount: 12 },
    { id: '6', name: 'Mini', slug: 'mini', logo: '/images/brands/mini.png', productCount: 9 },
  ];

  // Use fallback brands if API fails or returns empty
  const displayBrands = brands.length > 0 ? brands : fallbackBrands;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">SHOP BY POPULAR BRANDS</h2>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <div 
                key={index}
                className="flex flex-col items-center justify-center border border-gray-200 rounded-md p-4 animate-pulse"
              >
                <div className="w-24 h-24 bg-gray-200 rounded-md"></div>
                <div className="mt-2 h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 mb-4">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayBrands.map((brand) => (
              <Link 
                key={brand.id}
                href={`/products?brand=${brand.slug}`}
                className="flex flex-col items-center justify-center border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
              >
                <div className="w-24 h-24 relative flex items-center justify-center">
                  {brand.logo ? (
                    <Image 
                      src={brand.logo}
                      alt={brand.name}
                      width={96}
                      height={96}
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                      No logo
                    </div>
                  )}
                </div>
                <div className="mt-2 text-lg font-medium">
                  {brand.name}
                </div>
                {brand.productCount !== undefined && (
                  <div className="text-xs text-gray-500">
                    {brand.productCount} products
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
} 
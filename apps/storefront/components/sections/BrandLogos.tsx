"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  logoUrl?: string;
  productCount?: number;
}

export default function BrandLogos() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [renderId, setRenderId] = useState(1); // For forcing re-renders

  // Get the correct image URL
  const getImageUrl = useCallback((brand: Brand): string => {
    // Get logo from either logoUrl or logo property
    const logoPath = brand.logoUrl || brand.logo || '';
    
    // If there's no logo, use placeholder
    if (!logoPath) {
      return '/images/placeholder.jpg';
    }
    
    // If it's already a /storage/ path, use it directly
    if (logoPath.startsWith('/storage/')) {
      return logoPath;
    }
    
    // If it's a local image in the public directory, use as is
    if (logoPath.startsWith('/images/')) {
      return logoPath;
    }
    
    // If it's an absolute URL, use as is
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    
    // If we have a file path with 'brands/' in it, convert to storage path
    if (logoPath.includes('brands/')) {
      // Extract the filename from the path
      const segments = logoPath.split('/');
      const filename = segments[segments.length - 1];
      return `/storage/brands/${filename}`;
    }
    
    // If none of the above worked and we've had an error before, use placeholder
    if (logoErrors[brand.id]) {
      return '/images/placeholder.jpg';
    }
    
    // For other types of paths, normalize to storage path
    // First, clean the path of any leading slashes
    const cleanPath = logoPath.replace(/^\/+/, '');
    
    // If it includes public/, remove it
    if (cleanPath.includes('public/')) {
      const pathWithoutPublic = cleanPath.replace('public/', '');
      return `/${pathWithoutPublic}`;
    }
    
    // Last attempt: assume it's a filename and try in the brands directory
    if (cleanPath && !cleanPath.includes('/')) {
      return `/storage/brands/${cleanPath}`;
    }
    
    // Otherwise return the path as is with a leading slash
    return `/${cleanPath}`;
  }, [logoErrors]);

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
        } else {
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
  const fallbackBrands: Brand[] = [
    { id: '1', name: 'BMW', slug: 'bmw', logo: '/storage/brands/bmw.png', logoUrl: undefined, productCount: 24 },
    { id: '2', name: 'Audi', slug: 'audi', logo: '/storage/brands/audi.png', logoUrl: undefined, productCount: 18 },
    { id: '3', name: 'Benz', slug: 'benz', logo: '/storage/brands/benz.png', logoUrl: undefined, productCount: 32 },
    { id: '4', name: 'Jaguar', slug: 'jaguar', logo: '/storage/brands/jaguar.png', logoUrl: undefined, productCount: 15 },
    { id: '5', name: 'LR', slug: 'lr', logo: '/storage/brands/lr.png', logoUrl: undefined, productCount: 12 },
    { id: '6', name: 'Mini', slug: 'mini', logo: '/storage/brands/mini.png', logoUrl: undefined, productCount: 9 },
  ];

  // Use fallback brands if API fails or returns empty
  const displayBrands = brands.length > 0 ? brands : fallbackBrands;

  const handleImageError = (brandId: string, brandName: string, logoUrl: string) => {
    console.error(`Failed to load image for ${brandName}: ${logoUrl}`);
    
    // Update error state for this brand
    setLogoErrors(prev => ({
      ...prev,
      [brandId]: true
    }));
    
    // Force a re-render to try the fallback approach
    setRenderId(prev => prev + 1);
  };

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
            {displayBrands.map((brand) => {
              // Get image URL - will change if there's an error
              const imageUrl = getImageUrl(brand);
              
              return (
                <Link 
                  key={`${brand.id}-${renderId}`} // Include renderId to force re-render on error
                  href={`/products?brand=${brand.slug}`}
                  className="flex flex-col items-center justify-center border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-24 h-24 relative flex items-center justify-center">
                    {(brand.logo || brand.logoUrl) ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={imageUrl}
                          alt={brand.name}
                          className="max-w-full max-h-full object-contain"
                          onError={() => handleImageError(brand.id, brand.name, imageUrl)}
                          loading="lazy"
                        />
                        
                        {/* Overlay with brand name to ensure something is displayed even if image fails */}
                        {logoErrors[brand.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 text-gray-700 text-xs text-center p-1">
                            {brand.name}
                          </div>
                        )}
                      </div>
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
} 
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';

// Define the Product type
interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  slug: string;
  rating: number;
  reviews: number;
  isOnSale: boolean;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/products/featured?limit=4');
        
        if (!response.data || !response.data.products) {
          throw new Error('Invalid response format');
        }
        
        // Map the API response to match our component's expected format
        const formattedProducts = response.data.products.map((product: any) => ({
          id: product.id || product._id || '',
          name: product.name || 'Product',
          price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
          salePrice: product.salePrice ? parseFloat(product.salePrice) : undefined,
          image: product.mediaUrl || product.image || '/images/placeholder.jpg',
          slug: product.slug || product.id || '',
          rating: product.rating || 0,
          reviews: product.reviewCount || 0,
          isOnSale: product.salePrice && parseFloat(product.salePrice) > 0
        }));
        
        setProducts(formattedProducts);
        setError(null);
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">TOP CATEGORIES</h2>
            <div className="flex space-x-2">
              <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100">
                ←
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100">
                →
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="relative aspect-square bg-gray-200 rounded-md mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">TOP CATEGORIES</h2>
          </div>
          <div className="flex justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">TOP CATEGORIES</h2>
          <div className="flex space-x-2">
            <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100">
              ←
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100">
              →
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/products/${product.slug}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square overflow-hidden rounded-md mb-3">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
                {product.isOnSale && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    SALE
                  </div>
                )}
              </div>
              <h3 className="font-medium">{product.name}</h3>
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-yellow-400">
                    {i < Math.floor(product.rating) ? '★' : (i < product.rating ? '★' : '☆')}
                  </span>
                ))}
                <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
              </div>
              <div className="flex items-center mt-2">
                {product.isOnSale && product.salePrice !== undefined ? (
                  <>
                    <p className="text-gray-500 line-through mr-2">${product.price.toFixed(2)}</p>
                    <p className="text-red-500 font-semibold">${product.salePrice.toFixed(2)}</p>
                  </>
                ) : (
                  <p className="text-gray-700 font-semibold">${product.price.toFixed(2)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        <div className="flex justify-center mt-8">
          <Link 
            href="/shop" 
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
} 
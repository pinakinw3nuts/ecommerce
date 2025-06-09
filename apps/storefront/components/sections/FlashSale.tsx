"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRightIcon } from '../icons';
import axios from 'axios';

// Define the Product type
interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  href: string;
  image: string;
}

export default function FlashSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state for countdown
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0
  });
  
  // Fetch sale products from API
  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/products/sale?limit=3');
        
        if (!response.data || !response.data.products) {
          throw new Error('Invalid response format');
        }
        
        // Map the API response to match our component's expected format
        const formattedProducts = response.data.products.map((product: any) => ({
          id: product.id || product._id || '',
          name: product.name || 'Product',
          price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
          salePrice: product.salePrice ? parseFloat(product.salePrice) : 0,
          href: `/products/${product.slug || product.id || ''}`,
          image: product.mediaUrl || product.image || '/images/placeholder.jpg'
        }));
        
        setProducts(formattedProducts);
        setError(null);
      } catch (err) {
        console.error('Error fetching sale products:', err);
        setError('Failed to load sale products');
      } finally {
        setLoading(false);
      }
    };

    fetchSaleProducts();
  }, []);
  
  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset the timer when it reaches zero
          return { hours: 24, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">FLASH SALE</h2>
            <div className="flex items-center text-gray-600">
              View All
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">FLASH SALE</h2>
          </div>
          <div className="flex justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  // Only render if we have products
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">FLASH SALE</h2>
          <Link 
            href="/shop/sale" 
            className="flex items-center text-gray-600 hover:text-red-600"
          >
            View All
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={product.href}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square overflow-hidden rounded-md mb-3">
                <div 
                  className="w-full h-full bg-contain bg-center bg-no-repeat" 
                  style={{ backgroundImage: `url(${product.image})` }}
                ></div>
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  SALE
                </div>
              </div>
              <h3 className="font-medium">{product.name}</h3>
              <div className="flex items-center mt-2">
                <p className="text-gray-500 line-through mr-2">${product.price.toFixed(2)}</p>
                <p className="text-red-500 font-semibold">${product.salePrice.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 
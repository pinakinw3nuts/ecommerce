'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@components/ui/ProductCard';
import ProductListItem from '@components/shop/ProductListItem';
import FilterSidebar from '@components/shop/FilterSidebar';
import Pagination from '@components/shop/Pagination';
import { GridIcon, ListIcon, FilterIcon, XIcon } from 'lucide-react';
import { Button } from '@components/ui/Button';

// Define product type
export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  brand?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
}

// Define category type
export interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

// Define brand type
export interface Brand {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

// Define props for ProductPage
interface ProductPageProps {
  initialProducts: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  categories: Category[];
  brands: Brand[];
  initialSearchParams: {
    page?: string;
    limit?: string;
    sort?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    view?: 'grid' | 'list';
  };
}

// Sort options
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
  { value: 'rating_desc', label: 'Highest Rated' },
];

export default function ProductPage({
  initialProducts,
  totalProducts,
  totalPages,
  currentPage,
  categories,
  brands,
  initialSearchParams,
}: ProductPageProps) {
  // Router and search params
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>(
    initialSearchParams.view === 'list' ? 'list' : 'grid'
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Get current search params
  const currentSort = searchParams.get('sort') || 'newest';
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentLimit = searchParams.get('limit') || '12';
  
  // Update URL with new params
  const updateSearchParams = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    // Update or remove each parameter
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });
    
    // Always go back to page 1 when filters change
    if (Object.keys(params).some(key => key !== 'page')) {
      newSearchParams.set('page', '1');
    }
    
    // Navigate to new URL
    router.push(`/products?${newSearchParams.toString()}`);
  };
  
  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ sort: e.target.value });
  };
  
  // Handle view change
  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView);
    updateSearchParams({ view: newView });
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
  };
  
  // Handle limit change
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ limit: e.target.value });
  };
  
  // Handle filter changes
  const handleFilterChange = (
    filterType: 'category' | 'brand' | 'minPrice' | 'maxPrice',
    value: string | null
  ) => {
    updateSearchParams({ [filterType]: value });
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', '1');
    newSearchParams.set('view', view);
    router.push(`/products?${newSearchParams.toString()}`);
  };
  
  // Check if any filters are active
  const hasActiveFilters = currentCategory || currentBrand || currentMinPrice || currentMaxPrice || currentSearch;
  
  // Count number of active filters
  const activeFilterCount = [
    currentCategory,
    currentBrand,
    currentMinPrice,
    currentMaxPrice,
    currentSearch
  ].filter(Boolean).length;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with title and search count */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-gray-600 mt-2">
          {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
          {currentSearch ? ` for "${currentSearch}"` : ''}
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar - desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar 
            categories={categories}
            brands={brands}
            currentCategory={currentCategory}
            currentBrand={currentBrand}
            currentMinPrice={currentMinPrice}
            currentMaxPrice={currentMaxPrice}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        {/* Mobile filter sidebar */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
            <div className="absolute right-0 top-0 h-full w-80 bg-white p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Filters</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
              <FilterSidebar 
                categories={categories}
                brands={brands}
                currentCategory={currentCategory}
                currentBrand={currentBrand}
                currentMinPrice={currentMinPrice}
                currentMaxPrice={currentMaxPrice}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1">
          {/* Sort and view controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setShowMobileFilters(true)}
              >
                <FilterIcon className="h-4 w-4 mr-1" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-red-600 text-white rounded-full text-xs px-1.5">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial">
                <select
                  value={currentSort}
                  onChange={handleSortChange}
                  className="w-full sm:w-auto bg-white border border-gray-300 rounded px-3 py-1.5 text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  onClick={() => handleViewChange('grid')}
                  className={`p-1.5 ${
                    view === 'grid'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700'
                  }`}
                  aria-label="Grid view"
                >
                  <GridIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleViewChange('list')}
                  className={`p-1.5 ${
                    view === 'list'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700'
                  }`}
                  aria-label="List view"
                >
                  <ListIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Results per page selector */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={currentLimit}
                onChange={handleLimitChange}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
            </div>
          </div>
          
          {/* Loading state */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          )}
          
          {/* No results */}
          {!loading && products.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            </div>
          )}
          
          {/* Product grid view */}
          {!loading && products.length > 0 && view === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  productId={product.slug}
                  title={product.name}
                  price={`$${product.price.toFixed(2)}`}
                  imageUrl={product.imageUrl}
                  rating={product.rating}
                />
              ))}
            </div>
          )}
          
          {/* Product list view */}
          {!loading && products.length > 0 && view === 'list' && (
            <div className="space-y-4">
              {products.map(product => (
                <ProductListItem key={product.id} product={product} />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
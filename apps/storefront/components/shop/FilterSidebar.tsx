'use client';

import React, { useState } from 'react';
import { Slider } from '@components/ui/Slider';
import { Category, Brand } from './ProductPage';

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  currentCategory: string;
  currentBrand: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  onFilterChange: (
    filterType: 'category' | 'brand' | 'minPrice' | 'maxPrice',
    value: string | null
  ) => void;
}

export default function FilterSidebar({
  categories,
  brands,
  currentCategory,
  currentBrand,
  currentMinPrice,
  currentMaxPrice,
  onFilterChange,
}: FilterSidebarProps) {
  // Convert current price values to numbers or use defaults
  const minPrice = currentMinPrice ? parseInt(currentMinPrice) : 0;
  const maxPrice = currentMaxPrice ? parseInt(currentMaxPrice) : 1000;
  
  // State for price range slider
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  
  // Price range changed while dragging (doesn't trigger API call until released)
  const handlePriceRangeChange = (values: [number, number]) => {
    setPriceRange(values);
  };
  
  // Price range committed (on slider release)
  const handlePriceRangeCommit = (values: [number, number]) => {
    onFilterChange('minPrice', values[0].toString());
    onFilterChange('maxPrice', values[1].toString());
  };
  
  // Handle category selection
  const handleCategoryChange = (categorySlug: string) => {
    // If current category is clicked, clear the filter
    if (categorySlug === currentCategory) {
      onFilterChange('category', null);
    } else {
      onFilterChange('category', categorySlug);
    }
  };
  
  // Handle brand selection
  const handleBrandChange = (brandSlug: string) => {
    // If current brand is clicked, clear the filter
    if (brandSlug === currentBrand) {
      onFilterChange('brand', null);
    } else {
      onFilterChange('brand', brandSlug);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Categories Filter */}
      <div>
        <h3 className="text-lg font-medium mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">No categories available</p>
          ) : (
            categories.map(category => (
              <div key={category.id || category.slug} className="flex items-center">
                <button
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`flex items-center text-sm py-1 hover:text-red-600 w-full text-left ${
                    category.slug === currentCategory
                      ? 'font-medium text-red-600'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="flex-1">{category.name}</span>
                  {category.count !== undefined && (
                    <span className="text-xs text-gray-500 ml-1">({category.count})</span>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Brands Filter */}
      <div>
        <h3 className="text-lg font-medium mb-3">Brands</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {brands.length === 0 ? (
            <p className="text-sm text-gray-500">No brands available</p>
          ) : (
            brands.map(brand => (
              <div key={brand.id || brand.slug} className="flex items-center">
                <button
                  onClick={() => handleBrandChange(brand.slug)}
                  className={`flex items-center text-sm py-1 hover:text-red-600 w-full text-left ${
                    brand.slug === currentBrand
                      ? 'font-medium text-red-600'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="flex-1">{brand.name}</span>
                  {brand.count !== undefined && (
                    <span className="text-xs text-gray-500 ml-1">({brand.count})</span>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Price Range Filter */}
      <div>
        <h3 className="text-lg font-medium mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            defaultValue={[minPrice, maxPrice]}
            value={priceRange}
            min={0}
            max={1000}
            step={5}
            onValueChange={handlePriceRangeChange}
            onValueCommit={handlePriceRangeCommit}
            className="mt-6 mb-2"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
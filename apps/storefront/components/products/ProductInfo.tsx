'use client';

import { useState } from 'react';
import { Tag, Star, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/lib/types';
import ProductSizeGuide from './ProductSizeGuide';

interface ProductInfoProps {
  product: Product;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
}

export default function ProductInfo({
  product,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
}: ProductInfoProps) {
  const [activeTab, setActiveTab] = useState('description');
  
  // Format the discount percentage
  const discountPercentage = product.price && product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;
  
  // Check if product has colors
  const hasColors = product.colors && product.colors.length > 0;
  
  // Check if product has sizes
  const hasSizes = product.sizes && product.sizes.length > 0;
  
  // Get product category for size guide
  const productType = product.category?.toLowerCase().includes('shoe') ? 'shoes' : 'clothing';
  
  return (
    <div className="space-y-6">
      {/* Product Name & SKU */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          {product.name}
        </h1>
        <div className="flex items-center gap-4 mt-1">
          {product.sku && (
            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
          )}
          {product.brand && (
            <Link 
              href={`/brand/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-[#D23F57] hover:underline"
            >
              By {product.brand}
            </Link>
          )}
        </div>
      </div>
      
      {/* Ratings */}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Math.round(product.rating || 0)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-700 font-medium">
          {product.rating || 4.5} ({product.numReviews || 12} reviews)
        </span>
        {product.topSeller && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
            <CheckCircle className="h-3 w-3" />
            Top Seller
          </span>
        )}
      </div>
      
      {/* Pricing */}
      <div className="flex items-end gap-2">
        {product.discountedPrice ? (
          <>
            <span className="text-2xl font-bold text-[#D23F57]">
              {formatPrice(product.discountedPrice)}
            </span>
            <span className="text-lg text-gray-500 line-through">
              {formatPrice(product.price)}
            </span>
            {discountPercentage > 0 && (
              <span className="bg-[#D23F57] text-white text-xs font-bold px-2 py-1 rounded ml-2">
                {discountPercentage}% OFF
              </span>
            )}
          </>
        ) : (
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
        )}
      </div>
      
      {/* Availability & Shipping */}
      <div className="space-y-2 text-sm">
        {product.freeShipping && (
          <p className="text-green-600 font-medium flex items-center gap-1">
            <Tag className="h-4 w-4" />
            <span>Free Shipping</span>
          </p>
        )}
        
        {product.estimatedDelivery && (
          <p className="text-gray-600">
            Estimated Delivery: {product.estimatedDelivery}
          </p>
        )}
      </div>
      
      {/* Color Options */}
      {hasColors && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Color</h3>
            {selectedColor && <span className="text-sm text-gray-500">{selectedColor}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors?.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  selectedColor === color
                    ? 'border-[#D23F57] scale-110 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ 
                  backgroundColor: color.toLowerCase(),
                  boxShadow: selectedColor === color ? '0 0 0 2px #fff, 0 0 0 4px #D23F57' : 'none'
                }}
                aria-label={`Select ${color} color`}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Size Options */}
      {hasSizes && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Size</h3>
            <ProductSizeGuide productType={productType} />
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes?.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 border rounded-md min-w-[60px] text-center transition-all ${
                  selectedSize === size
                    ? 'border-[#D23F57] bg-[#D23F57]/5 text-[#D23F57] font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                aria-label={`Select size ${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Product Description Tabs */}
      <div className="mt-8 border-t pt-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-4 text-sm font-medium border-b-2 ${
                activeTab === 'description'
                  ? 'border-[#D23F57] text-[#D23F57]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Description
            </button>
            {product.longDescription && (
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-4 text-sm font-medium border-b-2 ${
                  activeTab === 'details'
                    ? 'border-[#D23F57] text-[#D23F57]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
            )}
            {product.specifications && product.specifications.length > 0 && (
              <button
                onClick={() => setActiveTab('specifications')}
                className={`pb-4 text-sm font-medium border-b-2 ${
                  activeTab === 'specifications'
                    ? 'border-[#D23F57] text-[#D23F57]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Specifications
              </button>
            )}
          </nav>
        </div>
        
        <div className="py-4 prose prose-sm max-w-none text-gray-600">
          {activeTab === 'description' && (
            <div>
              <p>{product.description}</p>
              
              {/* Product Features */}
              {product.features && product.features.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'details' && (
            <div>
              <div dangerouslySetInnerHTML={{ __html: product.longDescription || '' }} />
            </div>
          )}
          
          {activeTab === 'specifications' && product.specifications && (
            <div className="divide-y divide-gray-200">
              {product.specifications.map((spec, index) => (
                <div key={index} className="grid grid-cols-3 py-3">
                  <div className="font-medium text-gray-700">{spec.name}</div>
                  <div className="col-span-2 text-gray-600">{spec.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
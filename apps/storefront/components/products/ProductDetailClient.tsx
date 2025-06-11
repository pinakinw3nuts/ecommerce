'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Product, RelatedProduct, Review } from '@/lib/types';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import ProductActions from './ProductActions';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: RelatedProduct[];
  reviews?: Review[];
}

export default function ProductDetailClient({ 
  product, 
  relatedProducts,
  reviews = []
}: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm mb-8 text-gray-500 overflow-x-auto whitespace-nowrap pb-2">
        <Link href="/" className="hover:text-[#D23F57]">Home</Link>
        <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
        <Link href="/products" className="hover:text-[#D23F57]">Products</Link>
        {product.categories && product.categories[0] && (
          <>
            <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
            <Link 
              href={`/products?category=${product.categories[0]}`} 
              className="hover:text-[#D23F57]"
            >
              {product.categories[0]}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
        <span className="text-gray-900 truncate">{product.name}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <ProductGallery 
          images={product.images} 
          productName={product.name} 
        />
        
        {/* Product Info */}
        <div className="space-y-8">
          <ProductInfo 
            product={product}
            onSelectColor={setSelectedColor}
            onSelectSize={setSelectedSize}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
          />
          
          <ProductActions 
            product={product}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
          />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-12">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'description'
                  ? 'border-b-2 border-[#D23F57] text-[#D23F57]'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-label="View product description"
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-[#D23F57] text-[#D23F57]'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-label="View product reviews"
            >
              Reviews ({product.reviewCount})
            </button>
          </nav>
        </div>
        
        <div className="pt-6">
          {activeTab === 'description' ? (
            <div className="prose max-w-none">
              {/* Expanded description */}
              <div dangerouslySetInnerHTML={{ 
                __html: product.longDescription || product.description 
              }} />
              
              {/* Product specifications if available */}
              {product.specifications && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Specifications</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <tr key={key}>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                            {key}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <ProductReviews 
              productSlug={product.slug}
              initialReviews={reviews}
              averageRating={product.rating}
              totalReviews={product.reviewCount}
            />
          )}
        </div>
      </div>
      
      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
} 
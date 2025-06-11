'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import ProductGallery from '@/components/products/ProductGallery';
import ProductInfo from '@/components/products/ProductInfo';
import ProductActions from '@/components/products/ProductActions';
import ProductReviews from '@/components/products/ProductReviews';
import RelatedProducts from '@/components/products/RelatedProducts';
import ProductSpecifications from '@/components/products/ProductSpecifications';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0] : ''
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ''
  );
  
  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' }
  ];
  
  // Add category if available
  if (product.category) {
    breadcrumbItems.push({
      label: product.category,
      href: `/categories/${product.category.toLowerCase().replace(/\s+/g, '-')}`
    });
  }
  
  // Add product name
  breadcrumbItems.push({ label: product.name, href: `/products/${product.slug}` });
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      
      {/* Product Layout - Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Gallery */}
        <div>
          <ProductGallery 
            images={product.images || []} 
            productName={product.name} 
          />
        </div>
        
        {/* Product Info & Actions */}
        <div className="space-y-8">
          {/* Product Info */}
          <ProductInfo 
            product={product} 
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
          />
          
          {/* Product Actions */}
          <ProductActions 
            product={product} 
            selectedColor={selectedColor}
            selectedSize={selectedSize}
          />
        </div>
      </div>
      
      {/* Product Detailed Information */}
      <div className="mb-12">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full border-b justify-start mb-6">
            <TabsTrigger value="details">Details & Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-8">
            {/* Product Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <ProductSpecifications specifications={product.specifications} />
            )}
            
            {/* Additional Information */}
            <div className="prose prose-sm max-w-none">
              <h3 className="text-xl font-medium mb-4">Product Description</h3>
              {product.longDescription ? (
                <div dangerouslySetInnerHTML={{ __html: product.longDescription }} />
              ) : (
                <p>{product.description}</p>
              )}
              
              {/* Product Features */}
              {product.features && product.features.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-3">Key Features</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            <ProductReviews productId={product.id} />
          </TabsContent>
          
          <TabsContent value="shipping">
            <div className="prose prose-sm max-w-none">
              <h3 className="text-xl font-medium mb-4">Shipping Information</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">Delivery</h4>
                  <p>Orders are typically processed and shipped within 1-2 business days. Delivery times vary depending on your location:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Standard Shipping: 3-5 business days</li>
                    <li>Express Shipping: 1-2 business days</li>
                    <li>International Shipping: 7-14 business days</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-lg">Free Shipping</h4>
                  <p>We offer free standard shipping on all orders over $50 within the continental United States.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-lg">Returns & Exchanges</h4>
                  <p>We want you to be completely satisfied with your purchase. If for any reason you're not, you can return or exchange your items within 30 days of delivery.</p>
                  <p className="mt-2">To be eligible for a return, items must be unused, unworn, and in their original packaging with all tags attached.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-lg">How to Return</h4>
                  <ol className="list-decimal pl-5 mt-2">
                    <li>Log into your account and go to your order history</li>
                    <li>Select the order and items you wish to return</li>
                    <li>Print the prepaid return shipping label</li>
                    <li>Package your items securely and attach the label</li>
                    <li>Drop off the package at any authorized shipping location</li>
                  </ol>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div>
          <RelatedProducts products={relatedProducts} />
        </div>
      )}
    </div>
  );
}
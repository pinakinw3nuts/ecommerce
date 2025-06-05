'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/Button';

interface EditProductClientProps {
  id: string;
}

export function EditProductClient({ id }: EditProductClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        console.log('Product data received:', data);
        
        // Extract variant data for debugging
        if (data.variants && data.variants.length > 0) {
          console.log('First variant data:', data.variants[0]);
        } else {
          console.log('No variants found in product data');
        }
        
        // Transform the product data to match the form's expected format
        const transformedProduct = {
          ...data,
          // Extract SKU from variants or use root level sku
          sku: data.variants && data.variants.length > 0 
            ? data.variants[0].sku 
            : (data.sku || ''),
          
          // Extract stock from variants or use root level stock
          stock: data.variants && data.variants.length > 0 
            ? data.variants[0].stock 
            : (typeof data.stock === 'number' ? data.stock : 0),
          
          // Use categoryId directly or extract it from category object
          categoryId: data.categoryId || (data.category && typeof data.category === 'object' ? data.category.id : ''),
          
          // Ensure image is properly mapped
          image: data.mediaUrl || data.image || '',
          
          // Map featured and published status
          isFeatured: typeof data.isFeatured === 'boolean' ? data.isFeatured : false,
          isPublished: typeof data.isPublished === 'boolean' ? data.isPublished : false,
        };
        
        // Validate required fields are present
        if (!transformedProduct.sku) {
          console.warn('SKU is missing or empty after transformation');
        }
        
        if (transformedProduct.stock === undefined || transformedProduct.stock === null) {
          console.warn('Stock is undefined or null after transformation');
          // Provide a default value
          transformedProduct.stock = 0;
        }
        
        console.log('Transformed product data:', transformedProduct);
        setProduct(transformedProduct);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleUpdateProduct = async (data: any) => {
    console.log('Form data received:', data);
    
    // Format the data for the API
    const formattedData = {
      ...data,
      // Ensure numeric values are sent as numbers
      price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
      stock: typeof data.stock === 'number' ? data.stock : parseInt(data.stock) || 0,
      // Ensure SKU exists
      sku: data.sku || `SKU-${Date.now()}`,
      // Ensure boolean values are correct
      isFeatured: Boolean(data.isFeatured),
      isPublished: Boolean(data.isPublished),
    };
    
    console.log('Submitting product update:', formattedData);
    
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error updating product:', errorData);
      throw new Error(errorData.message || 'Failed to update product');
    }

    router.push('/products');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm
          initialData={product}
          onSubmit={handleUpdateProduct}
          isEditing
        />
      </div>
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Loader2, ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/Button';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        console.log('Product data received:', data);
        
        // Transform the product data to match the form's expected format
        const transformedProduct = {
          ...data,
          // If variants exist, use the first variant's SKU and stock
          sku: data.variants && data.variants.length > 0 ? data.variants[0].sku : data.sku || '',
          stock: data.variants && data.variants.length > 0 ? data.variants[0].stock : data.stock || 0,
          // Use categoryId directly or extract it from category object
          categoryId: data.categoryId || (data.category ? data.category.id : ''),
          // Ensure image is properly mapped
          image: data.mediaUrl || data.image || '',
          // Map featured status
          isFeatured: data.isFeatured || false,
        };
        
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
  }, [params.id]);

  const handleUpdateProduct = async (data: any) => {
    console.log('Submitting product update:', data);
    
    const response = await fetch(`/api/products/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
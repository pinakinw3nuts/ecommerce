'use client';

import { useRouter } from 'next/navigation';
import { Package, ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/Button';

export default function NewProductPage() {
  const router = useRouter();

  const handleCreateProduct = async (data: any) => {
    // This will be replaced with an actual API call
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create product');
    }

    router.push('/products');
    router.refresh();
  };

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
        <h1 className="text-2xl font-semibold text-gray-900">Create New Product</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm onSubmit={handleCreateProduct} />
      </div>
    </div>
  );
} 
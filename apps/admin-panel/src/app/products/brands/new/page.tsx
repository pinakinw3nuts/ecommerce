'use client';

import { useRouter } from 'next/navigation';
import { BrandForm } from '@/components/brands/BrandForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function NewBrandPage() {
  const router = useRouter();
  const toast = useToast();

  const handleCreateBrand = async (data: any) => {
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create brand');
      }

      toast.success('Brand created successfully');
      router.push('/products/brands');
      router.refresh();
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error('Failed to create brand');
      throw error;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Add New Brand"
        description="Create a new brand in your product catalog"
        actions={[
          {
            label: "Back to Brands",
            icon: ArrowLeft,
            onClick: () => router.back(),
            variant: "ghost"
          },
        ]}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <BrandForm onSubmit={handleCreateBrand} />
      </div>
    </div>
  );
} 
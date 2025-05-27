'use client';

import { useRouter } from 'next/navigation';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function NewCategoryPage() {
  const router = useRouter();
  const toast = useToast();

  const handleCreateCategory = async (data: any) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      toast.success('Category created successfully');
      router.push('/products/categories');
      router.refresh();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
      throw error;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Add New Category"
        description="Create a new category in your product catalog"
        actions={[
          {
            label: "Back to Categories",
            icon: ArrowLeft,
            onClick: () => router.back(),
            variant: "ghost"
          },
        ]}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CategoryForm onSubmit={handleCreateCategory} />
      </div>
    </div>
  );
} 
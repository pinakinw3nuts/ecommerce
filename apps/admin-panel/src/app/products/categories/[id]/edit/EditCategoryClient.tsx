'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

interface EditCategoryClientProps {
  id: string;
}

export function EditCategoryClient({ id }: EditCategoryClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [category, setCategory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        console.log('Fetching category:', id);
        const response = await fetch(`/api/categories/${id}`);
        console.log('Category response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            console.log('Unauthorized, redirecting to login');
            window.location.href = '/login';
            return;
          }
          throw new Error('Failed to load category');
        }

        const data = await response.json();
        console.log('Category data:', data);
        setCategory(data);
      } catch (error) {
        console.error('Error fetching category:', error);
        setError(error instanceof Error ? error.message : 'Failed to load category');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  const handleUpdateCategory = async (data: any) => {
    try {
      console.log('Updating category with data:', data);
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Update response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to update category');
      }

      const updatedCategory = await response.json();
      console.log('Updated category:', updatedCategory);
      toast.success('Category updated successfully');
      router.push('/products/categories');
      router.refresh();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update category');
      throw error;
    }
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
      <div className="space-y-6 p-6">
        <PageHeader
          title="Error"
          description="Failed to load category details"
          actions={[
            {
              label: "Back to Categories",
              onClick: () => router.back(),
              variant: "ghost"
            },
          ]}
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              setCategory(null);
              router.refresh();
            }}
            variant="ghost"
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Edit Category"
        description="Update category information"
        actions={[
          {
            label: "Back to Categories",
            onClick: () => router.back(),
            variant: "ghost"
          },
        ]}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CategoryForm
          initialData={category}
          onSubmit={handleUpdateCategory}
          isEditing
        />
      </div>
    </div>
  );
} 
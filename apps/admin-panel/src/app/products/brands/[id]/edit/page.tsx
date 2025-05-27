'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BrandForm } from '@/components/brands/BrandForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

interface EditBrandPageProps {
  params: {
    id: string;
  };
}

export default function EditBrandPage({ params }: EditBrandPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [brand, setBrand] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        console.log('Fetching brand with ID:', params.id);
        const response = await fetch(`/api/brands/${params.id}`);
        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          throw new Error(errorData.message || 'Failed to fetch brand');
        }

        const data = await response.json();
        console.log('Fetched brand data:', data);
        setBrand(data);
      } catch (error) {
        console.error('Error fetching brand:', error);
        setError(error instanceof Error ? error.message : 'Failed to load brand details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrand();
  }, [params.id]);

  const handleUpdateBrand = async (data: any) => {
    try {
      console.log('Updating brand with data:', data);
      const response = await fetch(`/api/brands/${params.id}`, {
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
        throw new Error(errorData.message || 'Failed to update brand');
      }

      const updatedBrand = await response.json();
      console.log('Updated brand:', updatedBrand);
      toast.success('Brand updated successfully');
      router.push('/products/brands');
      router.refresh();
    } catch (error) {
      console.error('Error updating brand:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update brand');
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
          description="Failed to load brand details"
          actions={[
            {
              label: "Back to Brands",
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
              setBrand(null);
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
        title="Edit Brand"
        description="Update brand information"
        actions={[
          {
            label: "Back to Brands",
            onClick: () => router.back(),
            variant: "ghost"
          },
        ]}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <BrandForm
          initialData={brand}
          onSubmit={handleUpdateBrand}
          isEditing
        />
      </div>
    </div>
  );
} 
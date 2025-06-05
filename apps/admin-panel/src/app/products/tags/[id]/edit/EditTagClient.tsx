'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TagForm } from '@/components/tags/TagForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface EditTagClientProps {
  id: string;
}

export function EditTagClient({ id }: EditTagClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [tag, setTag] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTag = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tags/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tag');
        }

        const data = await response.json();
        setTag(data);
      } catch (error) {
        console.error('Error fetching tag:', error);
        setError('Failed to load tag details');
        toast.error('Failed to load tag details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTag();
  }, [id]);

  const handleUpdateTag = async (data: any) => {
    try {
      console.log('Submitting tag update with data:', JSON.stringify(data, null, 2));
      
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to update tag');
      }

      const updatedTag = await response.json();
      console.log('Tag updated successfully:', updatedTag);
      
      toast.success('Tag updated successfully');
      router.push('/products/tags');
      router.refresh();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tag details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => router.push('/products/tags')}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Back to Tags
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Edit Tag"
        description="Update tag information"
        actions={[
          {
            label: "Back to Tags",
            icon: ArrowLeft,
            onClick: () => router.push('/products/tags'),
            variant: "ghost"
          },
        ]}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {tag && (
          <TagForm 
            initialData={tag} 
            onSubmit={handleUpdateTag} 
            isEditing={true} 
          />
        )}
      </div>
    </div>
  );
} 
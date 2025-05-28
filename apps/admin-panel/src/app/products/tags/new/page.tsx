'use client';

import { useRouter } from 'next/navigation';
import { TagForm } from '@/components/tags/TagForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function NewTagPage() {
  const router = useRouter();
  const toast = useToast();

  const handleCreateTag = async (data: any) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create tag');
      }

      toast.success('Tag created successfully');
      router.push('/products/tags');
      router.refresh();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
      throw error;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Add New Tag"
        description="Create a new tag in your product catalog"
        actions={[
          {
            label: "Back to Tags",
            icon: ArrowLeft,
            onClick: () => router.back(),
            variant: "ghost"
          },
        ]}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <TagForm onSubmit={handleCreateTag} />
      </div>
    </div>
  );
} 
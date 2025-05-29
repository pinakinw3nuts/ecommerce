'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import AttributeForm from '../../components/AttributeForm';
import { getAttributeById, updateAttribute, updateAttributeStatus } from '@/services/attributes';

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch attribute');
  return response.json();
};

export default function EditAttributePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: attribute, error, isLoading } = useSWR(
    `/api/products/attributes/${params.id}`,
    fetcher
  );

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      console.log('Submitting attribute update with data:', data);
      
      // Log the isActive field specifically
      console.log('isActive field value:', data.isActive);
      
      // Create a copy with explicitly set boolean values
      const formattedData = {
        ...data,
        isActive: data.isActive === undefined ? undefined : Boolean(data.isActive),
        isFilterable: data.isFilterable === undefined ? undefined : Boolean(data.isFilterable),
        isRequired: data.isRequired === undefined ? undefined : Boolean(data.isRequired)
      };
      
      console.log('Formatted data for update:', formattedData);
      console.log('Original attribute isActive:', attribute?.isActive);
      
      // Check if the isActive status is being changed
      if (attribute && formattedData.isActive !== undefined && formattedData.isActive !== attribute.isActive) {
        console.log(`Status is being changed from ${attribute.isActive} to ${formattedData.isActive}`);
        // Use the specialized status update function when changing status
        await updateAttributeStatus(params.id, formattedData.isActive);
        
        // Also update other fields if they've changed
        const { isActive, ...otherFields } = formattedData;
        if (Object.keys(otherFields).length > 0) {
          console.log('Updating other fields after status change');
          await updateAttribute(params.id, otherFields);
        }
      } else {
        // Use the regular update function when not changing status
        console.log('Using regular update function - status not changing');
        await updateAttribute(params.id, formattedData);
      }
      
      toast.success('Attribute updated successfully');
      router.push('/products/attributes');
    } catch (error) {
      console.error('Error updating attribute:', error);
      toast.error('Failed to update attribute');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load attribute</p>
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
        <h1 className="text-2xl font-semibold text-gray-900">
          {isLoading ? 'Loading...' : (attribute ? `Edit Attribute: ${attribute.name}` : 'Attribute Not Found')}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : !attribute ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Attribute not found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <AttributeForm 
            attribute={attribute}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
} 
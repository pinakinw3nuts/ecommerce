'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import AttributeForm from '../components/AttributeForm';
import { createAttribute } from '@/services/attributes';

export default function NewAttributePage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await createAttribute(data);
      toast.success('Attribute created successfully');
      router.push('/products/attributes');
    } catch (error) {
      console.error('Error creating attribute:', error);
      toast.error('Failed to create attribute');
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-2xl font-semibold text-gray-900">
          Create New Attribute
        </h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <AttributeForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
} 
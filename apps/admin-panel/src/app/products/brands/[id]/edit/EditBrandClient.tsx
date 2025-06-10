'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BrandForm } from '@/components/brands/BrandForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

interface EditBrandClientProps {
  id: string;
}

export function EditBrandClient({ id }: EditBrandClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [brand, setBrand] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        console.log('Fetching brand with ID:', id);
        const response = await fetch(`/api/brands/${id}`);
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
  }, [id]);

  const handleUpdateBrand = async (data: any) => {
    try {
      // Log the exact data we're sending
      console.log('Sending brand update data:', data);
      
      // Validate the data before sending
      if (!data || !data.name) {
        console.error('Invalid brand data - missing required fields');
        toast.error('Brand name is required');
        return;
      }
      
      // Make sure we have valid content
      const payload = {
        name: data.name,
        description: data.description || '',
        website: data.website || '',
        isActive: data.isActive === undefined ? true : data.isActive,
        ...(data.logoUrl && { logoUrl: data.logoUrl }),
      };
      
      console.log('Formatted payload:', payload);
      
      // Validate the payload isn't empty
      if (Object.keys(payload).length === 0) {
        console.error('Empty payload generated');
        toast.error('Cannot update with empty data');
        return;
      }
      
      // Stringify the payload and validate it's not empty
      const payloadString = JSON.stringify(payload);
      if (!payloadString || payloadString === '{}') {
        console.error('Empty JSON payload generated');
        toast.error('Cannot update with empty data');
        return;
      }
      
      console.log('Sending request to API with payload string:', payloadString);
      
      // Use the Fetch API with explicit options
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`/api/brands/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Accept': 'application/json'
          },
          body: payloadString,
          signal: controller.signal,
          cache: 'no-cache',
          credentials: 'same-origin'
        });
        
        clearTimeout(timeoutId);
        console.log('Update response status:', response.status);
        
        // Try to read the response body regardless of status
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          responseData = { message: responseText || 'Unknown error' };
        }
        
        if (!response.ok) {
          console.error('Error response data:', responseData);
          throw new Error(responseData.message || 'Failed to update brand');
        }

        console.log('Updated brand:', responseData);
        toast.success('Brand updated successfully');
        router.push('/products/brands');
        router.refresh();
      } catch (fetchError: unknown) {
        if ((fetchError as { name?: string })?.name === 'AbortError') {
          console.error('Request timed out');
          toast.error('Request timed out. Please try again.');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update brand');
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
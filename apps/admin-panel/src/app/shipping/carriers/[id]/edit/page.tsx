'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShippingCarrierForm } from '@/components/shipping/ShippingCarrierForm';
import { useToast } from '@/hooks/useToast';
import { shippingApi } from '@/services/shipping.service';
import { ShippingCarrier } from '@/types/shipping';
import { Loader2 } from 'lucide-react';

interface EditShippingCarrierPageProps {
  params: {
    id: string;
  };
}

export default function EditShippingCarrierPage({ params }: EditShippingCarrierPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [carrier, setCarrier] = useState<ShippingCarrier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchCarrier = async () => {
      try {
        const data = await shippingApi.getShippingCarrier(params.id);
        setCarrier(data);
      } catch (error) {
        console.error('Failed to fetch carrier:', error);
        toast.error('Failed to load shipping carrier');
        router.push('/shipping/carriers');
      } finally {
        setIsFetching(false);
      }
    };

    fetchCarrier();
  }, [params.id, router, toast]);

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await shippingApi.updateShippingCarrier(params.id, data);
      toast.success('Shipping carrier updated successfully');
      router.push('/shipping/carriers');
    } catch (error) {
      console.error('Failed to update carrier:', error);
      toast.error('Failed to update shipping carrier');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!carrier) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Shipping Carrier</h1>
      </div>

      <ShippingCarrierForm
        initialData={carrier}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
} 
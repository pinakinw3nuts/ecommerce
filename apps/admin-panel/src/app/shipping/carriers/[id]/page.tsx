'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';
import { shippingApi } from '@/services/shipping.service';
import { ShippingCarrier, ShippingCarrierType } from '@/types/shipping';
import { Loader2, ArrowLeft, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface ViewShippingCarrierPageProps {
  params: {
    id: string;
  };
}

export default function ViewShippingCarrierPage({ params }: ViewShippingCarrierPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [carrier, setCarrier] = useState<ShippingCarrier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
      }
    };

    fetchCarrier();
  }, [params.id, router, toast]);

  const handleDelete = async () => {
    if (!carrier) return;

    if (window.confirm('Are you sure you want to delete this carrier?')) {
      try {
        await shippingApi.deleteShippingCarrier(carrier.id);
        toast.success('Shipping carrier deleted successfully');
        router.push('/shipping/carriers');
      } catch (error) {
        console.error('Failed to delete carrier:', error);
        toast.error('Failed to delete shipping carrier');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!carrier) return;

    try {
      const updatedCarrier = await shippingApi.toggleShippingCarrierStatus(carrier.id);
      setCarrier(updatedCarrier);
      toast.success('Carrier status updated successfully');
    } catch (error) {
      console.error('Failed to toggle carrier status:', error);
      toast.error('Failed to update carrier status');
    }
  };

  const getCarrierTypeLabel = (type: string): string => {
    switch (type) {
      case ShippingCarrierType.DOMESTIC:
        return 'Domestic';
      case ShippingCarrierType.INTERNATIONAL:
        return 'International';
      case ShippingCarrierType.BOTH:
        return 'Both';
      case ShippingCarrierType.CUSTOM:
        return 'Custom';
      default:
        return type;
    }
  };

  if (isLoading) {
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/shipping/carriers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">{carrier.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleToggleStatus}
          >
            {carrier.isEnabled ? (
              <ToggleRight className="h-5 w-5 text-green-500" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-gray-400" />
            )}
            <span className={carrier.isEnabled ? 'text-green-500 ml-2' : 'text-gray-400 ml-2'}>
              {carrier.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/shipping/carriers/${carrier.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">Code</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {carrier.code}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">Type</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    carrier.type === ShippingCarrierType.DOMESTIC
                      ? 'bg-blue-100 text-blue-700'
                      : carrier.type === ShippingCarrierType.INTERNATIONAL
                      ? 'bg-purple-100 text-purple-700'
                      : carrier.type === ShippingCarrierType.BOTH
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {getCarrierTypeLabel(carrier.type)}
                  </span>
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">Description</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {carrier.description || 'No description provided'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">Weight Range</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {carrier.minimumWeight || carrier.maximumWeight ? (
                    <>
                      {carrier.minimumWeight ? `${carrier.minimumWeight}kg` : 'No minimum'} - {' '}
                      {carrier.maximumWeight ? `${carrier.maximumWeight}kg` : 'No maximum'}
                    </>
                  ) : (
                    'No weight limits'
                  )}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">Handling Fee</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {carrier.handlingFee ? (
                    <>
                      {carrier.handlingFee} {carrier.handlingFeeType === 'percentage' ? '%' : ''}
                    </>
                  ) : (
                    'No handling fee'
                  )}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">Delivery Time</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {carrier.estimatedDeliveryTime || 'Not specified'}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">Instructions</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {carrier.handlingInstructions || 'No special instructions'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
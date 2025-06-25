'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Select from 'react-select';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';
import { shippingApi } from '@/lib/shipping-api-client';
import { ShippingRate, ShippingMethod, ShippingZone } from '@/types/shipping';

const shippingRateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rate: z.coerce.number().min(0, 'Rate must be non-negative'),
  shippingMethodId: z.string().min(1, 'Shipping method is required'),
  shippingZoneId: z.string().min(1, 'Shipping zone is required'),
  isActive: z.boolean().default(true),
});

type ShippingRateFormValues = z.infer<typeof shippingRateSchema>;

export default function NewShippingRatePage() {
  const router = useRouter();
  const toast = useToast();

  const { data: methodsData } = useSWR('shippingMethods', () => shippingApi.listShippingMethods({}, { page: 1, limit: 100 }));
  const { data: zonesData } = useSWR('shippingZones', () => shippingApi.listShippingZones({}, { page: 1, limit: 100 }));

  const methodOptions = methodsData?.methods.map(m => ({ value: m.id, label: m.name })) || [];
  const zoneOptions = zonesData?.zones.map(z => ({ value: z.id, label: z.name })) || [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRateSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: ShippingRateFormValues) => {
    try {
      await shippingApi.createShippingRate(data as Partial<ShippingRate>);
      toast.success('Shipping rate created successfully');
      router.push('/shipping/rates');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Shipping Rate</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="rate">Rate</Label>
          <Input id="rate" type="number" step="0.01" {...register('rate')} />
          {errors.rate && <p className="text-red-500 text-sm">{errors.rate.message}</p>}
        </div>
        <div>
          <Label>Shipping Method</Label>
          <Controller
            name="shippingMethodId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={methodOptions}
                value={methodOptions.find(o => o.value === field.value)}
                onChange={val => field.onChange(val?.value)}
              />
            )}
          />
          {errors.shippingMethodId && <p className="text-red-500 text-sm">{errors.shippingMethodId.message}</p>}
        </div>
        <div>
          <Label>Shipping Zone</Label>
          <Controller
            name="shippingZoneId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={zoneOptions}
                value={zoneOptions.find(o => o.value === field.value)}
                onChange={val => field.onChange(val?.value)}
              />
            )}
          />
          {errors.shippingZoneId && <p className="text-red-500 text-sm">{errors.shippingZoneId.message}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Rate'}
          </Button>
        </div>
      </form>
    </div>
  );
} 
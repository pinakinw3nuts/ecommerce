'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import CreatableSelect from 'react-select/creatable';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';
import { shippingApi } from '@/lib/shipping-api-client';
import { ShippingZone } from '@/types/shipping';

const shippingZoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  countries: z.array(z.object({ label: z.string(), value: z.string() })).min(1, 'At least one country is required'),
  isActive: z.boolean().default(true),
});

type ShippingZoneFormValues = z.infer<typeof shippingZoneSchema>;

export default function EditShippingZonePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const toast = useToast();

  const { data: zone, error: fetchError } = useSWR<ShippingZone>(
    id ? `shippingZone_${id}` : null,
    () => shippingApi.getShippingZone(id as string)
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShippingZoneFormValues>({
    resolver: zodResolver(shippingZoneSchema),
  });

  useEffect(() => {
    if (zone) {
      const formattedZone = {
        ...zone,
        countries: zone.countries.map(c => ({ label: c, value: c })),
      };
      reset(formattedZone);
    }
  }, [zone, reset]);

  const onSubmit = async (data: ShippingZoneFormValues) => {
    const formattedData = {
      ...data,
      countries: data.countries.map(c => c.value),
    };

    try {
      await shippingApi.updateShippingZone(id as string, formattedData as Partial<ShippingZone>);
      toast.success('Shipping zone updated successfully');
      router.push('/shipping/zones');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (fetchError) return <p>Failed to load shipping zone.</p>;
  if (!zone) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Shipping Zone</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" {...register('code')} />
          {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} />
        </div>
        <div>
          <Label>Countries</Label>
          <Controller
            name="countries"
            control={control}
            render={({ field }) => (
              <CreatableSelect
                isMulti
                {...field}
                className="mt-1"
                placeholder="Type and press enter to add countries..."
              />
            )}
          />
          {errors.countries && <p className="text-red-500 text-sm">{errors.countries.message}</p>}
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
            {isSubmitting ? 'Updating...' : 'Update Zone'}
          </Button>
        </div>
      </form>
    </div>
  );
} 
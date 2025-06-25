'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';
import { shippingApi } from '@/lib/shipping-api-client';
import { ShippingMethod } from '@/types/shipping';

const shippingMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  baseRate: z.coerce.number().min(0, 'Base rate must be non-negative'),
  estimatedDays: z.coerce.number().int().min(0, 'Estimated days must be a non-negative integer'),
  isActive: z.boolean().default(true),
});

type ShippingMethodFormValues = z.infer<typeof shippingMethodSchema>;

export default function NewShippingMethodPage() {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ShippingMethodFormValues>({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: ShippingMethodFormValues) => {
    try {
      await shippingApi.createShippingMethod(data as Partial<ShippingMethod>);
      toast.success('Shipping method created successfully');
      router.push('/shipping/methods');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Shipping Method</h1>
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
          <Label htmlFor="baseRate">Base Rate</Label>
          <Input id="baseRate" type="number" step="0.01" {...register('baseRate')} />
          {errors.baseRate && <p className="text-red-500 text-sm">{errors.baseRate.message}</p>}
        </div>
        <div>
          <Label htmlFor="estimatedDays">Estimated Days</Label>
          <Input id="estimatedDays" type="number" {...register('estimatedDays')} />
          {errors.estimatedDays && <p className="text-red-500 text-sm">{errors.estimatedDays.message}</p>}
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
            {isSubmitting ? 'Creating...' : 'Create Method'}
          </Button>
        </div>
      </form>
    </div>
  );
} 
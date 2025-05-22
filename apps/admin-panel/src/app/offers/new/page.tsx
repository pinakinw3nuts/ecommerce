'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Validation schema
const couponSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be less than 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  type: z.enum(['flat', 'percent'], {
    required_error: 'Please select a discount type',
  }),
  value: z.number()
    .min(0, 'Value must be positive')
    .max(100, 'Percentage cannot exceed 100%')
    .refine((val) => val > 0, 'Value must be greater than 0'),
  expiryDate: z.string()
    .refine((date) => new Date(date) > new Date(), 'Expiry date must be in the future'),
  maxUsage: z.number()
    .int('Must be a whole number')
    .min(1, 'Must allow at least one use')
    .max(10000, 'Maximum usage limit is 10,000'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters')
    .optional(),
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function NewCouponPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      type: 'flat',
      maxUsage: 100,
    },
  });

  const discountType = watch('type');

  const onSubmit = async (data: CouponFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create coupon');
      }

      router.push('/offers');
      router.refresh();
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Failed to create coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Create New Coupon</h1>
      </div>

      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Coupon Code
            </label>
            <input
              type="text"
              {...register('code')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="SUMMER2024"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Use uppercase letters, numbers, underscores, and hyphens only
            </p>
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discount Type
            </label>
            <select
              {...register('type')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="flat">Flat Amount ($)</option>
              <option value="percent">Percentage (%)</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {discountType === 'flat' ? 'Discount Amount ($)' : 'Discount Percentage (%)'}
            </label>
            <input
              type="number"
              step={discountType === 'flat' ? '0.01' : '1'}
              {...register('value', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={discountType === 'flat' ? '10.00' : '20'}
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Expiry Date
            </label>
            <input
              type="date"
              {...register('expiryDate')}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.expiryDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>
            )}
          </div>

          {/* Max Usage */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Usage Limit
            </label>
            <input
              type="number"
              {...register('maxUsage', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="100"
            />
            {errors.maxUsage && (
              <p className="mt-1 text-sm text-red-600">{errors.maxUsage.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Maximum number of times this coupon can be used
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter any additional details about this coupon..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
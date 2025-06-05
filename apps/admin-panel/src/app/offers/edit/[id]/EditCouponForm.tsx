'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { offerService } from '@/services/offers';
import { useToast } from '@/hooks/useToast';
import { DateTimeInput } from '@/components/ui/DateTimeInput';

// Validation schema
const couponSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be less than 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters')
    .optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountAmount: z.number()
    .min(0.01, 'Value must be greater than 0')
    .superRefine((val, ctx) => {
      const parent = ctx.path.length ? (ctx as any).parent : {};
      const discountType = parent?.discountType || 'FIXED';
      
      if (discountType === 'PERCENTAGE' && val > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Percentage discount cannot exceed 100%',
        });
      }
    }),
  startDate: z.string(),
  endDate: z.string(),
  usageLimit: z.number()
    .int('Must be a whole number')
    .min(1, 'Must allow at least one use')
    .max(10000, 'Maximum usage limit is 10,000')
    .optional()
    .nullable(),
  minimumPurchaseAmount: z.number()
    .min(0, 'Minimum purchase amount must be positive')
    .optional()
    .nullable(),
  perUserLimit: z.number()
    .int('Must be a whole number')
    .min(1, 'Must allow at least one use per user')
    .max(100, 'Maximum per user limit is 100')
    .optional()
    .nullable(),
  isFirstPurchaseOnly: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type CouponFormData = z.infer<typeof couponSchema>;

// Client Component that receives the unwrapped ID
export function EditCouponForm({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const methods = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      discountType: 'FIXED',
      discountAmount: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      isFirstPurchaseOnly: false,
      isActive: true,
    },
  });

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = methods;
  const discountType = watch('discountType');
  const isActive = watch('isActive');

  // Fetch coupon data
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        setIsLoading(true);
        const coupon = await offerService.getCouponById(id);
        
        reset({
          ...coupon,
          discountAmount: Number(coupon.discountAmount),
          usageLimit: coupon.usageLimit ? Number(coupon.usageLimit) : null,
          minimumPurchaseAmount: coupon.minimumPurchaseAmount ? Number(coupon.minimumPurchaseAmount) : null,
          perUserLimit: coupon.perUserLimit ? Number(coupon.perUserLimit) : null,
        });
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load coupon data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchCoupon();
  }, [id, reset]);

  const onSubmit = async (data: CouponFormData) => {
    try {
      setIsSubmitting(true);
      
      // Ensure isActive is explicitly set as a boolean
      const couponData = {
        ...data,
        discountAmount: Number(data.discountAmount),
        usageLimit: data.usageLimit !== null ? Number(data.usageLimit) : undefined,
        minimumPurchaseAmount: data.minimumPurchaseAmount !== null ? Number(data.minimumPurchaseAmount) : undefined,
        perUserLimit: data.perUserLimit !== null ? Number(data.perUserLimit) : undefined,
        isActive: Boolean(data.isActive),
      };
      
      console.log('Submitting coupon data with isActive:', couponData.isActive);
      await offerService.updateCoupon(id, couponData);
      toast.success('Coupon updated successfully');
      router.push('/offers');
    } catch (error) {
      toast.error('Failed to update coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600">Loading coupon data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => router.push('/offers')}
            className="mt-4"
            variant="outline"
          >
            Return to Offers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Coupon</h1>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Coupon Name
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Summer Sale 2024"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter a description for this coupon..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Discount Configuration */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Discount Configuration</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount Type
                  </label>
                  <select
                    {...register('discountType')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="FIXED">Flat Amount ($)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                  {errors.discountType && (
                    <p className="mt-1 text-sm text-red-600">{errors.discountType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {discountType === 'FIXED' ? 'Discount Amount ($)' : 'Discount Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    step={discountType === 'FIXED' ? '0.01' : '1'}
                    {...register('discountAmount', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.discountAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.discountAmount.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Validity Period</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date & Time
                  </label>
                  <DateTimeInput name="startDate" label="Start Date & Time" />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date & Time
                  </label>
                  <DateTimeInput name="endDate" label="End Date & Time" />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Usage Restrictions */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Usage Restrictions</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Purchase Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('minimumPurchaseAmount', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.minimumPurchaseAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.minimumPurchaseAmount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    {...register('usageLimit', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.usageLimit && (
                    <p className="mt-1 text-sm text-red-600">{errors.usageLimit.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    {...register('perUserLimit', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.perUserLimit && (
                    <p className="mt-1 text-sm text-red-600">{errors.perUserLimit.message}</p>
                  )}
                </div>

                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="isFirstPurchaseOnly"
                    {...register('isFirstPurchaseOnly')}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isFirstPurchaseOnly" className="ml-2 block text-sm text-gray-700">
                    First purchase only
                  </label>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setValue('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/offers')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Coupon'
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
} 
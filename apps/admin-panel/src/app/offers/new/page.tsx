'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
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
  discountType: z.enum(['PERCENTAGE', 'FIXED'], {
    required_error: 'Please select a discount type',
  }),
  discountAmount: z.number()
    .min(0, 'Value must be positive')
    .refine((val) => val > 0, 'Value must be greater than 0')
    .superRefine((val, ctx) => {
      const discountType = ctx.path.length 
        ? (ctx as any).parent?.discountType || 'FIXED'
        : 'FIXED';
      if (discountType === 'PERCENTAGE' && val > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Percentage discount cannot exceed 100%',
        });
      }
    }),
  startDate: z.string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), 'Start date must not be in the past'),
  endDate: z.string()
    .refine((date) => new Date(date) > new Date(), 'End date must be in the future'),
  usageLimit: z.number()
    .int('Must be a whole number')
    .min(1, 'Must allow at least one use')
    .max(10000, 'Maximum usage limit is 10,000')
    .optional(),
  minimumPurchaseAmount: z.number()
    .min(0, 'Minimum purchase amount must be positive')
    .optional(),
  isFirstPurchaseOnly: z.boolean().default(false),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function NewCouponPage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const methods = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      discountType: 'FIXED',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      isFirstPurchaseOnly: false,
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = methods;
  const discountType = watch('discountType');

  const onSubmit = async (data: CouponFormData) => {
    try {
      setIsSubmitting(true);
      
      // Ensure discountAmount is properly typed
      const couponData = {
        ...data,
        discountAmount: Number(data.discountAmount),
      };
      
      await offerService.createCoupon(couponData);
      toast.success('Coupon created successfully');
      router.push('/offers');
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error('Failed to create coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Coupon</h1>

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
                    placeholder={discountType === 'FIXED' ? '10.00' : '20'}
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
                <DateTimeInput
                  name="startDate"
                  label="Start Date & Time"
                  required
                  minDate={new Date()}
                />
                <DateTimeInput
                  name="endDate"
                  label="End Date & Time"
                  required
                  minDate={new Date()}
                />
              </div>
            </div>

            {/* Usage Restrictions */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Usage Restrictions</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    {...register('usageLimit', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="100"
                  />
                  {errors.usageLimit && (
                    <p className="mt-1 text-sm text-red-600">{errors.usageLimit.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Purchase Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('minimumPurchaseAmount', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="50.00"
                  />
                  {errors.minimumPurchaseAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.minimumPurchaseAmount.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isFirstPurchaseOnly')}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    First Purchase Only
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                Create Coupon
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
} 
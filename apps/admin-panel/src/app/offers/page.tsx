'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percent';
  value: number;
  expiryDate: string;
  usageCount: number;
  isActive: boolean;
}

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters'),
  type: z.enum(['flat', 'percent']),
  value: z.number().min(0, 'Value must be positive'),
  expiryDate: z.string(),
});

type CouponFormData = z.infer<typeof couponSchema>;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OffersPage() {
  const [isCreating, setIsCreating] = useState(false);
  const { data: coupons, error, mutate } = useSWR<Coupon[]>('/api/coupons', fetcher);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
  });

  const handleCreateCoupon = async (data: CouponFormData) => {
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create coupon');
      
      await mutate();
      setIsCreating(false);
      reset();
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Failed to create coupon. Please try again.');
    }
  };

  const handleDeactivate = async (couponId: string) => {
    if (!confirm('Are you sure you want to deactivate this coupon?')) return;

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to deactivate coupon');
      await mutate();
    } catch (error) {
      console.error('Error deactivating coupon:', error);
      alert('Failed to deactivate coupon. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load coupons</p>
      </div>
    );
  }

  if (!coupons) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Promotional Offers</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {coupon.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {coupon.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {coupon.type === 'percent' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(coupon.expiryDate), 'PP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {coupon.usageCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeactivate(coupon.id)}
                    disabled={!coupon.isActive}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create New Coupon</h2>
            
            <form onSubmit={handleSubmit(handleCreateCoupon)} className="space-y-4">
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
                  Type
                </label>
                <select
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percent">Percentage</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="number"
                  {...register('value', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="10"
                />
                {errors.value && (
                  <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  {...register('expiryDate')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Coupon
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
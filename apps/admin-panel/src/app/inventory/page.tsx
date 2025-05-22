'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

// Mock data - will be replaced with API calls
const mockProducts = [
  {
    id: 'prod_001',
    name: 'Classic White T-Shirt',
    sku: 'WT-CLS-M',
    currentStock: 45,
    lowStockThreshold: 20,
    variant: 'Medium',
  },
  {
    id: 'prod_002',
    name: 'Classic White T-Shirt',
    sku: 'WT-CLS-L',
    currentStock: 15,
    lowStockThreshold: 20,
    variant: 'Large',
  },
  {
    id: 'prod_003',
    name: 'Denim Jeans',
    sku: 'DNM-BLU-32',
    currentStock: 28,
    lowStockThreshold: 10,
    variant: '32 Regular',
  },
];

const stockUpdateSchema = z.object({
  newStock: z.number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  reason: z.string()
    .min(5, 'Please provide a reason for the update')
    .max(200, 'Reason is too long'),
});

type StockUpdateFormData = z.infer<typeof stockUpdateSchema>;

export default function InventoryPage() {
  const toast = useToast();
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stockUpdateAmount, setStockUpdateAmount] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockUpdateFormData>({
    resolver: zodResolver(stockUpdateSchema),
  });

  const handleUpdateStock = async (data: StockUpdateFormData) => {
    try {
      setIsLoading(true);
      // This will be replaced with an actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Updating stock:', { product: selectedProduct?.id, ...data });
      
      setIsUpdateModalOpen(false);
      reset();
      toast.success(`Stock updated successfully (${data.newStock > 0 ? '+' : ''}${data.newStock} units)`);
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package2 className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variant/SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
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
            {mockProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    <p className="font-medium">{product.variant}</p>
                    <p className="text-xs text-gray-400">{product.sku}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.currentStock} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.currentStock <= product.lowStockThreshold ? (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-600 font-medium">
                        Low Stock
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      In Stock
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {selectedProduct === product ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={stockUpdateAmount}
                        onChange={(e) => setStockUpdateAmount(e.target.value)}
                        className="block w-20 rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="±qty"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStock({ newStock: parseInt(stockUpdateAmount), reason: '' })}
                        disabled={isLoading || !stockUpdateAmount}
                      >
                        Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(null);
                          setStockUpdateAmount('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      Update Stock
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Stock Modal */}
      {isUpdateModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Update Stock</h2>
              <button
                onClick={() => {
                  setIsUpdateModalOpen(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Updating stock for <span className="font-medium">{selectedProduct.name}</span>
              </p>
              <p className="text-sm text-gray-500">
                SKU: {selectedProduct.sku} | Current Stock: {selectedProduct.currentStock} units
              </p>
            </div>

            <form onSubmit={handleSubmit(handleUpdateStock)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Stock Level
                </label>
                <input
                  type="number"
                  {...register('newStock', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter new stock level"
                />
                {errors.newStock && (
                  <p className="mt-1 text-sm text-red-600">{errors.newStock.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Update
                </label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., New shipment received, Inventory count adjustment"
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Stock'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
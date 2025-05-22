'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  stock: z.number().int().min(0, 'Stock must be greater than or equal to 0'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  isPublished: z.boolean().default(false),
  image: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isEditing?: boolean;
}

// Mock categories - will be replaced with API data
const mockCategories = [
  { id: 'cat1', name: 'Clothing' },
  { id: 'cat2', name: 'Electronics' },
  { id: 'cat3', name: 'Books' },
  { id: 'cat4', name: 'Home & Garden' },
];

export function ProductForm({ initialData, onSubmit, isEditing = false }: ProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '');
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      stock: initialData?.stock || 0,
      sku: initialData?.sku || '',
      categories: initialData?.categories || [],
      isPublished: initialData?.isPublished || false,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error(isEditing ? 'Failed to update product' : 'Failed to create product');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Product Image
        </label>
        <div className="mt-1 flex items-center gap-4">
          {imagePreview ? (
            <div className="relative h-32 w-32 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                }}
                className="absolute right-1 top-1 rounded-full bg-white/80 p-1 hover:bg-white"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Upload className="mx-auto h-6 w-6 text-gray-400" />
                <div className="mt-1 text-xs text-gray-500">Upload image</div>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="product-image"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('product-image')?.click()}
          >
            {imagePreview ? 'Change Image' : 'Upload Image'}
          </Button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Maximum file size: 5MB. Recommended size: 1000x1000px
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            SKU
          </label>
          <input
            type="text"
            {...register('sku')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.sku && (
            <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock
          </label>
          <input
            type="number"
            {...register('stock', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Categories
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {mockCategories.map((category) => (
            <label
              key={category.id}
              className="flex items-center space-x-2 rounded-md border border-gray-200 p-2"
            >
              <input
                type="checkbox"
                value={category.id}
                {...register('categories')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{category.name}</span>
            </label>
          ))}
        </div>
        {errors.categories && (
          <p className="mt-1 text-sm text-red-600">{errors.categories.message}</p>
        )}
      </div>

      {/* Publishing Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('isPublished')}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          Publish product immediately
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
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
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Product' : 'Create Product'
          )}
        </Button>
      </div>
    </form>
  );
} 
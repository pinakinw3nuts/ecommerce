'use client';

import { useState, useEffect } from 'react';
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
  categoryId: z.string().min(1, 'Please select a category'),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  image: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isEditing?: boolean;
}

// Category type definition
interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export function ProductForm({ initialData, onSubmit, isEditing = false }: ProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [hasFetchedCategories, setHasFetchedCategories] = useState(false);
  const toast = useToast();
  
  // Debug initial data
  useEffect(() => {
    console.log('ProductForm initialData:', initialData);
    console.log('Using image URL:', initialData?.image || 'none');
    console.log('Initial categoryId:', initialData?.categoryId || 'none');
  }, [initialData]);

  // Fetch categories when component mounts
  useEffect(() => {
    // Prevent multiple fetch attempts
    if (hasFetchedCategories) return;
    
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        setCategoryError(null);
        
        // Add the correct query parameters that the API expects
        const response = await fetch('/api/categories?pageSize=100', {
          cache: 'no-store', // Prevent caching
          headers: { 'x-fetch-time': Date.now().toString() } // Add unique header to prevent caching
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch categories (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Raw categories API response:', data);
        
        // Handle different response formats
        let categoryData: Category[] = [];
        
        if (Array.isArray(data)) {
          categoryData = data;
        } else if (data.data && Array.isArray(data.data)) {
          categoryData = data.data;
        } else if (data.categories && Array.isArray(data.categories)) {
          categoryData = data.categories;
        }
        
        console.log('Categories loaded:', categoryData);
        
        if (categoryData.length === 0) {
          console.warn('No categories found in response:', data);
        }
        
        setCategories(categoryData);
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        setCategoryError(error.message || 'Failed to load categories');
        toast.error('Failed to load categories. Please try again.');
      } finally {
        setIsLoadingCategories(false);
        setHasFetchedCategories(true);
      }
    };

    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  const retryFetchCategories = () => {
    toast.info('Retrying category fetch...');
    setIsLoadingCategories(true);
    setCategoryError(null);
    setHasFetchedCategories(false); // Reset the flag to allow a new fetch
    
    // Trigger re-fetch by forcing a re-render
    setTimeout(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/categories?pageSize=100', { 
            cache: 'no-store',
            headers: { 
              'x-retry': 'true',
              'x-fetch-time': Date.now().toString() // Add timestamp to bypass cache
            }
          });
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Failed to fetch categories (${response.status})`);
          }
          
          const data = await response.json();
          console.log('Raw categories API response on retry:', data);
          
          // Handle different response formats
          let categoryData: Category[] = [];
          
          if (Array.isArray(data)) {
            categoryData = data;
          } else if (data.data && Array.isArray(data.data)) {
            categoryData = data.data;
          } else if (data.categories && Array.isArray(data.categories)) {
            categoryData = data.categories;
          }
          
          console.log('Categories loaded on retry:', categoryData);
          
          if (categoryData.length === 0) {
            console.warn('No categories found in response on retry:', data);
          }
          
          setCategories(categoryData);
          toast.success('Categories loaded successfully');
        } catch (error: any) {
          console.error('Error retrying category fetch:', error);
          setCategoryError(error.message || 'Failed to load categories');
          toast.error('Still unable to load categories. Please check if the product service is running.');
        } finally {
          setIsLoadingCategories(false);
          setHasFetchedCategories(true);
        }
      };
      
      fetchCategories();
    }, 500);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      stock: initialData?.stock || 0,
      sku: initialData?.sku || '',
      categoryId: initialData?.categoryId || '',
      isPublished: initialData?.isPublished !== undefined ? initialData.isPublished : false,
      isFeatured: initialData?.isFeatured !== undefined ? initialData.isFeatured : false,
    },
  });
  
  // Debug form values
  const formValues = watch();
  useEffect(() => {
    if (isEditing) {
      console.log('Current form values:', formValues);
    }
  }, [formValues, isEditing]);

  // Update the useEffect to set the categoryId when component mounts
  useEffect(() => {
    // Set initial categoryId if available from initialData
    if (initialData?.categoryId) {
      setValue('categoryId', initialData.categoryId);
    }
  }, [initialData, setValue]);

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
      console.log('Form submission data:', data);
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
          Category
        </label>
        {isLoadingCategories ? (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading categories...</span>
          </div>
        ) : categoryError ? (
          <div className="mt-2 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading categories</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{categoryError}</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={retryFetchCategories}
                    className="text-sm"
                  >
                    Retry
                  </Button>
                  
                  {/* Fallback option */}
                  <div className="flex items-center space-x-2 rounded-md border border-gray-200 p-2">
                    <select
                      {...register('categoryId')}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      defaultValue="default-category"
                    >
                      <option value="default-category">Default Category (fallback)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : categories.length > 0 ? (
          <div className="mt-2">
            <select
              {...register('categoryId')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option 
                  key={category.id} 
                  value={category.id}
                  selected={initialData?.categoryId === category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-2 rounded-md bg-amber-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">No categories found</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>Please create a category first before adding products.</p>
                </div>
                <div className="mt-4">
                  {/* Fallback option */}
                  <select
                    {...register('categoryId')}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    defaultValue="default-category"
                  >
                    <option value="default-category">Default Category (fallback)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Publishing Status */}
      <div className="flex flex-col gap-4">
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
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('isFeatured')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">
            Feature this product (display prominently)
          </label>
        </div>
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
        <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
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
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormToggle } from '@/components/settings/FormToggle';
import { useToast } from '@/hooks/useToast';
import { Select } from '@/components/ui/Select';
import useSWR from 'swr';
import { CategoryListingResponse, Category } from '@/types/category';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  parentId: z.string().nullable(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData> & { id?: string };
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isEditing?: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
  disabled: boolean;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

export function CategoryForm({ initialData, onSubmit, isEditing = false }: CategoryFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const { data: parentCategories } = useSWR<CategoryListingResponse>(
    '/api/categories?pageSize=100',
    fetcher
  );

  // Filter out the current category from parent options to prevent circular references
  const availableParentCategories = parentCategories?.categories?.filter(category => 
    !isEditing || category.id !== initialData?.id
  ) || [];

  // Build a hierarchical structure for categories
  const buildCategoryOptions = (): CategoryOption[] => {
    if (!availableParentCategories.length) return [];
    
    // First, identify root categories (those with no parent)
    const rootCategories = availableParentCategories.filter(cat => !cat.parentId);
    
    // Then recursively build the options
    const buildOptions = (categories: Category[], level = 0): CategoryOption[] => {
      return categories.flatMap(category => {
        // Create the option for this category with proper indentation
        const option: CategoryOption = {
          id: category.id,
          name: `${'\u00A0'.repeat(level * 4)}${level > 0 ? '└─ ' : ''}${category.name}`,
          disabled: isEditing && category.id === initialData?.id
        };
        
        // Find children of this category
        const children = availableParentCategories.filter(cat => cat.parentId === category.id);
        
        // If there are children, recursively add them with increased indentation
        if (children.length > 0) {
          return [option, ...buildOptions(children, level + 1)];
        }
        
        return [option];
      });
    };
    
    return buildOptions(rootCategories);
  };
  
  const categoryOptions = buildCategoryOptions();

  // Function to check if selecting a parent would create a circular reference
  const isCircularReference = (parentId: string): boolean => {
    if (!isEditing || !initialData?.id) return false;
    
    // Find the potential parent
    const parent = availableParentCategories.find(cat => cat.id === parentId);
    
    // If parent has this category as its parent, it would create a circular reference
    return parent?.parentId === initialData.id;
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedParentId = e.target.value;
    
    // Check for circular reference
    if (selectedParentId && isCircularReference(selectedParentId)) {
      toast.error('Cannot select this parent: would create a circular reference');
      e.target.value = initialData?.parentId || '';
      return;
    }
    
    // Set parentId as null if empty string, otherwise use the selected value
    setValue('parentId', selectedParentId === '' ? null : selectedParentId, { shouldDirty: true });
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      parentId: initialData?.parentId || null,
      imageUrl: initialData?.imageUrl || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();
      setValue('imageUrl', url, { shouldDirty: true });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      // Ensure parentId is properly formatted (null or string)
      const formattedData = {
        ...data,
        parentId: data.parentId === '' ? null : data.parentId
      };
      
      console.log('Submitting category data:', formattedData);
      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category Image
        </label>
        <div className="mt-2 flex items-center gap-4">
          {watch('imageUrl') && (
            <img
              src={watch('imageUrl')}
              alt="Category"
              className="h-20 w-20 rounded-lg object-cover"
            />
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Upload Image
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </label>
          {isUploading && (
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category Name
          </label>
          <Input
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Parent Category
          </label>
          <select
            {...register('parentId')}
            onChange={handleParentChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">No Parent (Root Category)</option>
            {categoryOptions.map((category) => (
              <option 
                key={category.id} 
                value={category.id}
                disabled={category.disabled}
              >
                {category.name}
              </option>
            ))}
          </select>
          {errors.parentId && (
            <p className="mt-1 text-sm text-red-600">{errors.parentId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <div className="mt-2">
            <FormToggle
              checked={watch('isActive')}
              onCheckedChange={(checked) => {
                setValue('isActive', checked, { shouldDirty: true });
              }}
              label="Active"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <Textarea
          {...register('description')}
          error={errors.description?.message}
          rows={4}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
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
            isEditing ? 'Update Category' : 'Create Category'
          )}
        </Button>
      </div>
    </form>
  );
} 
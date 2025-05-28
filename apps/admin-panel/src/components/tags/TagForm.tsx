'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormToggle } from '@/components/settings/FormToggle';
import { useToast } from '@/hooks/useToast';
import { useEffect } from 'react';

const tagSchema = z.object({
  name: z.string().min(2, 'Tag name must be at least 2 characters'),
  slug: z.string().optional(),
  isActive: z.boolean().default(true),
});

type TagFormData = z.infer<typeof tagSchema>;

interface TagFormProps {
  initialData?: Partial<TagFormData>;
  onSubmit: (data: TagFormData) => Promise<void>;
  isEditing?: boolean;
}

export function TagForm({ initialData, onSubmit, isEditing = false }: TagFormProps) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  // Auto-generate slug from name if slug is empty
  const name = watch('name');
  useEffect(() => {
    if (!getValues('slug') && name) {
      const slugValue = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
      setValue('slug', slugValue, { shouldDirty: true });
    }
  }, [name, setValue, getValues]);

  const handleFormSubmit = async (data: TagFormData) => {
    try {
      await onSubmit(data);
      // Toast is handled in the parent component
    } catch (error) {
      console.error('Error submitting tag:', error);
      toast.error(isEditing ? 'Failed to update tag' : 'Failed to create tag');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tag Name
          </label>
          <Input
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Slug
          </label>
          <Input
            {...register('slug')}
            error={errors.slug?.message}
            placeholder="tag-slug"
          />
          <p className="mt-1 text-xs text-gray-500">
            Used in URLs. Leave empty to auto-generate from name.
          </p>
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

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
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
            isEditing ? 'Update Tag' : 'Create Tag'
          )}
        </Button>
      </div>
    </form>
  );
} 
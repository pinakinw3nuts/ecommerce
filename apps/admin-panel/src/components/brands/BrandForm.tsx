'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormToggle } from '@/components/settings/FormToggle';
import { useToast } from '@/hooks/useToast';

const brandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  website: z.union([
    z.string().url('Invalid website URL'),
    z.literal(''),
  ]).optional().transform(val => val === undefined ? '' : val),
  description: z.string().optional().transform(val => val || ''),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormProps {
  initialData?: Partial<BrandFormData & {
    logoUrl?: string; // API field
  }>;
  onSubmit: (data: any) => Promise<void>;
  isEditing?: boolean;
}

export function BrandForm({ initialData, onSubmit, isEditing = false }: BrandFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(() => {
    // If we have a logoUrl from the API, ensure it has the proper prefix
    if (initialData?.logoUrl) {
      // If it's already a full URL, keep it as is
      if (initialData.logoUrl.startsWith('http')) {
        return initialData.logoUrl;
      }
      
      // For relative paths from our product service, use the image proxy API
      // Remove any leading slash and use our image proxy
      const cleanPath = initialData.logoUrl.replace(/^\/+/, '');
      return `/api/images/${cleanPath}`;
    }
    // Fallback to logo field or empty string
    return initialData?.logo || '';
  });
  const toast = useToast();

  console.log('Initial data for form:', initialData);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: initialData?.name || '',
      website: initialData?.website || '',
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,
      logo: initialData?.logoUrl || initialData?.logo || '',
    },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo size must be less than 5MB');
        return;
      }

      try {
        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        setLogoFile(file);
        
        // Upload the file to the server
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/brands/upload-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload logo');
        }
        
        const data = await response.json();
        
        // Update the form with the new logo URL
        setValue('logo', data.imageUrl, { shouldDirty: true });
        
        // Format the image URL for the proxy API
        const cleanPath = data.imageUrl.replace(/^\/+/, '');
        const previewUrl = `/api/images/${cleanPath}`;
        
        setLogoPreview(previewUrl);
        toast.success('Logo uploaded successfully');
      } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Failed to upload logo');
      }
    }
  };

  const handleFormSubmit = async (data: BrandFormData) => {
    try {
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        toast.error('Brand name is required');
        return;
      }
      
      // Map form fields to API fields
      const apiData = {
        name: data.name.trim(),
        description: data.description ? data.description.trim() : '',
        website: data.website ? data.website.trim() : '',
        logoUrl: data.logo || '',
        isActive: data.isActive
      };
      
      console.log('Formatted API data:', apiData);
      
      // Validate the API data isn't empty
      if (!apiData.name) {
        toast.error('Brand name cannot be empty');
        return;
      }
      
      // Log the stringified data to check for issues
      const jsonData = JSON.stringify(apiData);
      console.log('Stringified API data:', jsonData);
      
      if (jsonData === '{}' || !jsonData) {
        toast.error('Cannot submit empty data');
        return;
      }
      
      await onSubmit(apiData);
      toast.success(isEditing ? 'Brand updated successfully' : 'Brand created successfully');
    } catch (error) {
      console.error('Error submitting brand:', error);
      toast.error(isEditing ? 'Failed to update brand' : 'Failed to create brand');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Brand Logo
        </label>
        <div className="mt-1 flex items-center gap-4">
          {logoPreview ? (
            <div className="relative h-32 w-32 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoPreview}
                alt="Brand logo preview"
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setLogoFile(null);
                  setLogoPreview('');
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
                <div className="mt-1 text-xs text-gray-500">Upload logo</div>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
            id="brand-logo"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('brand-logo')?.click()}
          >
            {logoPreview ? 'Change Logo' : 'Upload Logo'}
          </Button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Maximum file size: 5MB. Recommended format: SVG, PNG
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Brand Name
          </label>
          <Input
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <Input
            type="url"
            {...register('website')}
            error={errors.website?.message}
            placeholder="https://"
          />
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
            isEditing ? 'Update Brand' : 'Create Brand'
          )}
        </Button>
      </div>
    </form>
  );
} 
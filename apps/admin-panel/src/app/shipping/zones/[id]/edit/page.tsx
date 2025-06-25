'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';
import { shippingApi } from '@/lib/shipping-api-client';
import { ShippingZone } from '@/types/shipping';

interface ApiResponse {
  statusCode: number;
  message: string;
  data: ShippingZone;
}

// Import the request type from shipping-api-client
interface ShippingZoneUpdateRequest {
  name?: string;
  code?: string;
  description?: string;
  countries?: string[];
  regions?: Array<{
    country: string;
    state: string;
    city: string;
    pincode: string;
  }>;
  pincodePatterns?: string[];
  pincodeRanges?: string[];
  excludedPincodes?: string[];
  isActive?: boolean;
  priority?: number;
}

const regionSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().min(1, 'Pincode is required'),
});

// Define the form values type based on the schema but with specific pincodeRanges type
type ShippingZoneFormValues = Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt' | 'rates' | 'methods'> & {
  pincodeRanges: { start: string; end: string; }[];
  pincodePatterns: string[];
  excludedPincodes: string[];
};

// Create the schema with the correct types
const shippingZoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  countries: z.array(z.string()).min(1, 'At least one country is required'),
  regions: z.array(z.object({
    country: z.string(),
    state: z.string(),
    city: z.string(),
    pincode: z.string()
  })),
  pincodePatterns: z.array(z.string()),
  pincodeRanges: z.array(z.object({
    start: z.string(),
    end: z.string()
  })),
  excludedPincodes: z.array(z.string()),
  isActive: z.boolean(),
  priority: z.number().int().min(0)
});

export default function EditShippingZonePage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pincodePatternInput, setPincodePatternInput] = useState('');
  const [excludedPincodesInput, setExcludedPincodesInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ShippingZoneFormValues>({
    resolver: zodResolver(shippingZoneSchema),
    defaultValues: {
      countries: [],
      regions: [],
      pincodePatterns: [],
      pincodeRanges: [],
      excludedPincodes: [],
      isActive: true,
      priority: 0
    }
  });

  // Remove the watch hooks and their effects
  const { fields: regionFields, append: appendRegion, remove: removeRegion } = useFieldArray({
    control,
    name: 'regions',
  });

  const { fields: pincodeRangeFields, append: appendPincodeRange, remove: removePincodeRange } = useFieldArray({
    control,
    name: 'pincodeRanges',
  });

  const fetcher = async (key: string): Promise<ApiResponse> => {
    const zoneId = key.replace('shippingZone_', '');
    return shippingApi.getShippingZone(zoneId);
  };

  const { data: zoneResponse, error: fetchError, isLoading } = useSWR<ApiResponse>(
    params.id ? `shippingZone_${params.id}` : null,
    fetcher
  );

  // Initialize form data when zone data is loaded
  useEffect(() => {
    if (zoneResponse?.data) {
      const zone = zoneResponse.data;
      // Initialize form data
      reset({
        ...zone,
        countries: zone.countries?.map((c: string) => c.replace(/[{}]/g, '')) || [],
        pincodePatterns: zone.pincodePatterns || [],
        excludedPincodes: zone.excludedPincodes || [],
      });

      // Set initial input states
      setPincodePatternInput(zone.pincodePatterns?.join(', ') || '');
      setExcludedPincodesInput(zone.excludedPincodes?.join(', ') || '');
    }
  }, [zoneResponse, reset]);

  const onSubmit = async (data: ShippingZoneFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create the API request data with the correct types
      const requestData: ShippingZoneUpdateRequest = {
        name: data.name,
        code: data.code,
        description: data.description,
        countries: data.countries.map(c => `{${c.trim()}}`),
        regions: data.regions,
        pincodePatterns: pincodePatternInput
          .split(',')
          .map(p => p.trim())
          .filter(Boolean),
        // Format pincode ranges as "start-end" strings
        pincodeRanges: data.pincodeRanges.map(range => `${range.start}-${range.end}`),
        excludedPincodes: excludedPincodesInput
          .split(',')
          .map(p => p.trim())
          .filter(Boolean),
        isActive: data.isActive,
        priority: data.priority
      };
      
      await shippingApi.updateShippingZone(params.id as string, requestData);
      router.push('/shipping/zones');
      toast.success('Shipping zone updated successfully');
    } catch (error) {
      console.error('Error updating shipping zone:', error);
      toast.error('Failed to update shipping zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fetchError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Failed to load shipping zone</p>
          <p className="text-sm mt-1">
            {fetchError instanceof Error ? fetchError.message : 'An unexpected error occurred'}
          </p>
          <Button
            variant="ghost"
            className="mt-2 text-red-600 hover:text-red-800 hover:bg-red-100"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!zoneResponse?.data) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Shipping Zone</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" {...register('code')} />
            {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              {...register('priority', { valueAsNumber: true })}
              min={0}
            />
            {errors.priority && <p className="text-red-500 text-sm">{errors.priority.message}</p>}
          </div>
        </div>

        {/* Countries */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Countries</h2>
          <div>
            <Label>Countries (comma-separated)</Label>
            <Controller
              name="countries"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="IN, US, GB"
                  value={field.value?.join(', ') || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Split by comma, trim whitespace, and filter out empty strings
                    const countries = value.split(',')
                      .map(c => c.trim())
                      .filter(Boolean);
                    field.onChange(countries);
                  }}
                />
              )}
            />
            {errors.countries && <p className="text-red-500 text-sm">{errors.countries.message}</p>}
          </div>
        </div>

        {/* Regions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Regions</h2>
          {regionFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-4 gap-4 p-4 border rounded">
              <div>
                <Label>Country</Label>
                <Input {...register(`regions.${index}.country`)} />
                {errors.regions?.[index]?.country && (
                  <p className="text-red-500 text-sm">{errors.regions[index]?.country?.message}</p>
                )}
              </div>
              <div>
                <Label>State</Label>
                <Input {...register(`regions.${index}.state`)} />
                {errors.regions?.[index]?.state && (
                  <p className="text-red-500 text-sm">{errors.regions[index]?.state?.message}</p>
                )}
              </div>
              <div>
                <Label>City</Label>
                <Input {...register(`regions.${index}.city`)} />
                {errors.regions?.[index]?.city && (
                  <p className="text-red-500 text-sm">{errors.regions[index]?.city?.message}</p>
                )}
              </div>
              <div>
                <Label>Pincode</Label>
                <Input {...register(`regions.${index}.pincode`)} />
                {errors.regions?.[index]?.pincode && (
                  <p className="text-red-500 text-sm">{errors.regions[index]?.pincode?.message}</p>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeRegion(index)}
                className="col-span-4"
              >
                Remove Region
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendRegion({ country: '', state: '', city: '', pincode: '' })}
          >
            Add Region
          </Button>
        </div>

        {/* Pincode Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pincode Configuration</h2>
          <div>
            <Label>Pincode Patterns (comma-separated)</Label>
            <Controller
              name="pincodePatterns"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="380001, 380002"
                  value={pincodePatternInput}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // Only allow numbers and commas
                    value = value.replace(/[^0-9,]/g, '');
                    
                    // Remove consecutive commas
                    value = value.replace(/,+/g, ',');
                    
                    // If backspacing (value is shorter than previous)
                    if (value.length < pincodePatternInput.length) {
                      // If we just removed a number and we're left with a trailing comma or space
                      if (value.match(/,\s*$/)) {
                        value = value.replace(/,\s*$/, '');
                      }
                    } else {
                      // If typing, add space after comma if not present
                      value = value.replace(/,(?!\s)/g, ', ');
                    }
                    
                    setPincodePatternInput(value);
                    const patterns = value.split(',')
                      .map(p => p.trim())
                      .filter(Boolean);
                    field.onChange(patterns);
                  }}
                  onBlur={() => {
                    // Clean up any trailing commas and spaces on blur
                    const cleanValue = pincodePatternInput.replace(/,\s*$/, '');
                    setPincodePatternInput(cleanValue);
                    const patterns = cleanValue.split(',')
                      .map(p => p.trim())
                      .filter(Boolean);
                    field.onChange(patterns);
                  }}
                />
              )}
            />
            {errors.pincodePatterns && <p className="text-red-500 text-sm">{errors.pincodePatterns.message}</p>}
          </div>
          
          {/* Pincode Ranges */}
          <div className="space-y-4">
            <Label>Pincode Ranges</Label>
            {pincodeRangeFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Start</Label>
                  <Input {...register(`pincodeRanges.${index}.start`)} placeholder="380001" />
                  {errors.pincodeRanges?.[index]?.start && (
                    <p className="text-red-500 text-sm">{errors.pincodeRanges[index]?.start?.message}</p>
                  )}
                </div>
                <div className="flex-1">
                  <Label>End</Label>
                  <Input {...register(`pincodeRanges.${index}.end`)} placeholder="380010" />
                  {errors.pincodeRanges?.[index]?.end && (
                    <p className="text-red-500 text-sm">{errors.pincodeRanges[index]?.end?.message}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removePincodeRange(index)}
                  className="mb-1"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendPincodeRange({ start: '', end: '' })}
            >
              Add Pincode Range
            </Button>
          </div>

          <div>
            <Label>Excluded Pincodes (comma-separated)</Label>
            <Controller
              name="excludedPincodes"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="380003, 380005"
                  value={excludedPincodesInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Add comma if the user types a number and there's already content
                    const shouldAddComma = 
                      value.length > excludedPincodesInput.length && // User is typing, not deleting
                      !value.endsWith(', ') && // Don't add comma if it already ends with comma
                      value.match(/\d$/) && // Last character is a number
                      value.includes(',') && // There's already at least one comma
                      !value.endsWith(','); // Don't add comma if it already ends with one
                    
                    const newValue = shouldAddComma ? value + ', ' : value;
                    setExcludedPincodesInput(newValue);
                    const excluded = newValue.split(',')
                      .map(p => p.trim())
                      .filter(Boolean);
                    field.onChange(excluded);
                  }}
                  onBlur={() => {
                    // Clean up any trailing commas on blur
                    const cleanValue = excludedPincodesInput.replace(/,\s*$/, '');
                    setExcludedPincodesInput(cleanValue);
                    const excluded = cleanValue.split(',')
                      .map(p => p.trim())
                      .filter(Boolean);
                    field.onChange(excluded);
                  }}
                />
              )}
            />
            {errors.excludedPincodes && <p className="text-red-500 text-sm">{errors.excludedPincodes.message}</p>}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Status</h2>
          <div className="flex items-center space-x-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
} 
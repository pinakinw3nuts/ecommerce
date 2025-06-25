'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';
import { shippingApi } from '@/lib/shipping-api-client';
import { ShippingZone } from '@/types/shipping';
import { Checkbox } from '@/components/ui/Checkbox';

// Define the form values type based on the schema but with specific pincodeRanges type
type ShippingZoneFormValues = Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt' | 'rates' | 'methods'> & {
  pincodeRanges: { start: string; end: string; }[];
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

export default function AddShippingZonePage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pincodePatternInput, setPincodePatternInput] = useState('');
  const [excludedPincodesInput, setExcludedPincodesInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue
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

  const { fields: regionFields, append: appendRegion, remove: removeRegion } = useFieldArray({
    control,
    name: 'regions',
  });

  const { fields: pincodeRangeFields, append: appendPincodeRange, remove: removePincodeRange } = useFieldArray({
    control,
    name: 'pincodeRanges',
  });

  useEffect(() => {
    setPincodePatternInput(control._defaultValues.pincodePatterns?.join(', ') || '');
    setExcludedPincodesInput(control._defaultValues.excludedPincodes?.join(', ') || '');
  }, [control._defaultValues]);

  const onSubmit = async (data: ShippingZoneFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create the API request data with the correct types
      const requestData: Partial<ShippingZone> = {
        name: data.name,
        code: data.code,
        description: data.description,
        countries: data.countries.map(c => `{${c.trim()}}`),
        regions: data.regions,
        pincodePatterns: data.pincodePatterns || [],
        pincodeRanges: data.pincodeRanges,
        excludedPincodes: data.excludedPincodes || [],
        isActive: data.isActive,
        priority: data.priority
      };
      
      await shippingApi.createShippingZone(requestData);
      router.push('/shipping/zones');
      toast.success('Shipping zone created successfully');
    } catch (error) {
      console.error('Error creating shipping zone:', error);
      toast.error('Failed to create shipping zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Shipping Zone</h1>
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
                <Input {...register(`regions.${index}.country`)} placeholder="Country" />
              </div>
              <div>
                <Label>State</Label>
                <Input {...register(`regions.${index}.state`)} placeholder="State" />
              </div>
              <div>
                <Label>City</Label>
                <Input {...register(`regions.${index}.city`)} placeholder="City" />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input {...register(`regions.${index}.pincode`)} placeholder="Pincode" />
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
                    const value = e.target.value;
                    setPincodePatternInput(value);
                    const patterns = value.split(',')
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
                    setExcludedPincodesInput(value);
                    const excluded = value.split(',')
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
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Zone'}
          </Button>
        </div>
      </form>
    </div>
  );
} 
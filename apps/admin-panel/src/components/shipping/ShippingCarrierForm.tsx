'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent } from '@/components/ui/Card';
import { ShippingCarrier, ShippingCarrierType } from '@/types/shipping';

// Form validation schema
const carrierFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  type: z.nativeEnum(ShippingCarrierType),
  description: z.string().optional(),
  logo: z.string().optional().nullable(),
  isEnabled: z.boolean().default(true),
  supportedCountries: z.array(z.string()),
  minimumWeight: z.number().min(0).optional().nullable(),
  maximumWeight: z.number().min(0).optional().nullable(),
  excludedRegions: z.array(z.string()).optional().nullable(),
  handlingInstructions: z.string().optional().nullable(),
  handlingFee: z.number().min(0).optional().nullable(),
  handlingFeeType: z.enum(['fixed', 'percentage']).optional().nullable(),
  estimatedDeliveryTime: z.string().optional().nullable(),
  settings: z.record(z.any()).optional().default({}),
});

type CarrierFormData = z.infer<typeof carrierFormSchema>;

interface ShippingCarrierFormProps {
  initialData?: ShippingCarrier;
  onSubmit: (data: CarrierFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ShippingCarrierForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ShippingCarrierFormProps) {
  const form = useForm<CarrierFormData>({
    resolver: zodResolver(carrierFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      type: initialData?.type || ShippingCarrierType.DOMESTIC,
      description: initialData?.description || '',
      logo: initialData?.logo || null,
      isEnabled: initialData?.isEnabled ?? true,
      supportedCountries: initialData?.supportedCountries || [],
      minimumWeight: initialData?.minimumWeight || null,
      maximumWeight: initialData?.maximumWeight || null,
      excludedRegions: initialData?.excludedRegions || null,
      handlingInstructions: initialData?.handlingInstructions || null,
      handlingFee: initialData?.handlingFee || null,
      handlingFeeType: initialData?.handlingFeeType || null,
      estimatedDeliveryTime: initialData?.estimatedDeliveryTime || null,
      settings: initialData?.settings || {},
    },
  });

  const handleSubmit = async (data: CarrierFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter carrier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter carrier code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select carrier type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ShippingCarrierType.DOMESTIC}>
                          Domestic
                        </SelectItem>
                        <SelectItem value={ShippingCarrierType.INTERNATIONAL}>
                          International
                        </SelectItem>
                        <SelectItem value={ShippingCarrierType.BOTH}>
                          Both
                        </SelectItem>
                        <SelectItem value={ShippingCarrierType.CUSTOM}>
                          Custom
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <FormDescription>
                        Enable or disable this shipping carrier
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter carrier description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="minimumWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter minimum weight"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maximumWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter maximum weight"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="handlingFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handling Fee</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter handling fee"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="handlingFeeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6">
              <FormField
                control={form.control}
                name="handlingInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handling Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter handling instructions"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : initialData ? 'Update Carrier' : 'Create Carrier'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 
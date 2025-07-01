'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/hooks/useToast';
import { PaymentService, UpdatePaymentGatewayParams } from '@/services/payment.service';
import { PaymentGateway, PaymentGatewayType } from '@/types/payment';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  code: z.string().min(2, { message: 'Code must be at least 2 characters' })
    .regex(/^[a-z0-9_-]+$/, { message: 'Code must contain only lowercase letters, numbers, underscores and hyphens' }),
  type: z.enum(['direct', 'redirect', 'iframe', 'offline']),
  description: z.string().optional(),
  logo: z.string().optional().nullable(),
  isEnabled: z.boolean().default(false),
  supportedCurrencies: z.array(z.string()).min(1, { message: 'At least one currency must be supported' }),
  minimumAmount: z.number().optional().nullable(),
  maximumAmount: z.number().optional().nullable(),
  countries: z.array(z.string()).optional().nullable(),
  excludedCountries: z.array(z.string()).optional().nullable(),
  paymentInstructions: z.string().optional().nullable(),
  transactionFee: z.number().optional().nullable(),
  transactionFeeType: z.enum(['fixed', 'percentage']).optional().nullable(),
  processingTime: z.string().optional().nullable(),
  settings: z.record(z.any()).default({}),
});

type FormValues = z.infer<typeof formSchema>;

const gatewayTypes = [
  { value: 'direct', label: 'Direct' },
  { value: 'redirect', label: 'Redirect' },
  { value: 'iframe', label: 'Iframe' },
  { value: 'offline', label: 'Offline' },
];

const feeTypes = [
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'percentage', label: 'Percentage' },
];

const commonCurrencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
];

export default function EditPaymentGatewayPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'direct',
      description: '',
      logo: null,
      isEnabled: false,
      supportedCurrencies: ['USD'],
      minimumAmount: null,
      maximumAmount: null,
      countries: null,
      excludedCountries: null,
      paymentInstructions: null,
      transactionFee: null,
      transactionFeeType: null,
      processingTime: null,
      settings: {},
    }
  });

  // Fetch payment gateway data
  useEffect(() => {
    const fetchGateway = async () => {
      try {
        setIsLoading(true);
        const data = await PaymentService.getPaymentGatewayById(params.id);
        setGateway(data);
        
        // Reset form with fetched data
        reset({
          name: data.name,
          code: data.code,
          type: data.type,
          description: data.description || '',
          logo: data.logo,
          isEnabled: data.isEnabled,
          supportedCurrencies: data.supportedCurrencies,
          minimumAmount: data.minimumAmount,
          maximumAmount: data.maximumAmount,
          countries: data.countries,
          excludedCountries: data.excludedCountries,
          paymentInstructions: data.paymentInstructions,
          transactionFee: data.transactionFee,
          transactionFeeType: data.transactionFeeType,
          processingTime: data.processingTime,
          settings: data.settings,
        });
      } catch (error) {
        console.error('Failed to fetch payment gateway:', error);
        toast.error('Failed to load payment gateway');
        router.push('/payments/methods/gateways');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGateway();
  }, [params.id, reset, router, toast]);

  const onSubmit = async (data: FormValues) => {
    if (!gateway) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the data for API
      const gatewayData: UpdatePaymentGatewayParams = {
        id: gateway.id,
        ...data,
        // Ensure settings is an object
        settings: data.settings || {},
      };
      
      // Update the payment gateway
      await PaymentService.updatePaymentGateway(gatewayData);
      
      toast.success('Payment gateway updated successfully');
      router.push('/payments/methods/gateways');
    } catch (error: any) {
      console.error('Failed to update payment gateway:', error);
      toast.error(error?.message || 'Failed to update payment gateway');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Payment Gateway</h1>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="name" 
                    placeholder="e.g. Credit Card" 
                    error={errors.name?.message}
                    {...field}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="code" 
                    placeholder="e.g. credit_card" 
                    error={errors.code?.message}
                    {...field}
                  />
                )}
              />
              <p className="text-xs text-gray-500">
                Unique identifier for the gateway. Use only lowercase letters, numbers, underscores and hyphens.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Gateway Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select 
                    id="type"
                    options={gatewayTypes}
                    error={errors.type?.message}
                    {...field}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="isEnabled">Status</Label>
              <div className="flex items-center space-x-2">
                <Controller
                  name="isEnabled"
                  control={control}
                  render={({ field }) => (
                    <Switch 
                      id="isEnabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isEnabled">
                  {gateway?.isEnabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea 
                    id="description" 
                    placeholder="Enter a description for this payment gateway"
                    rows={3}
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="supportedCurrencies">Supported Currencies</Label>
              <Controller
                name="supportedCurrencies"
                control={control}
                render={({ field }) => (
                  <Select 
                    id="supportedCurrencies"
                    options={commonCurrencies}
                    isMulti
                    error={errors.supportedCurrencies?.message}
                    value={commonCurrencies.filter(option => 
                      field.value?.includes(option.value)
                    )}
                    onChange={(selected) => {
                      field.onChange(selected.map(option => option.value));
                    }}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="processingTime">Processing Time</Label>
              <Controller
                name="processingTime"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="processingTime" 
                    placeholder="e.g. 1-2 business days"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumAmount">Minimum Amount</Label>
              <Controller
                name="minimumAmount"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="minimumAmount" 
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maximumAmount">Maximum Amount</Label>
              <Controller
                name="maximumAmount"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="maximumAmount" 
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transactionFee">Transaction Fee</Label>
              <Controller
                name="transactionFee"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="transactionFee" 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transactionFeeType">Fee Type</Label>
              <Controller
                name="transactionFeeType"
                control={control}
                render={({ field }) => (
                  <Select 
                    id="transactionFeeType"
                    options={feeTypes}
                    isClearable
                    {...field}
                    value={feeTypes.find(option => option.value === field.value) || null}
                    onChange={(selected) => field.onChange(selected?.value || null)}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="paymentInstructions">Payment Instructions</Label>
              <Controller
                name="paymentInstructions"
                control={control}
                render={({ field }) => (
                  <Textarea 
                    id="paymentInstructions" 
                    placeholder="Instructions for customers on how to complete payment"
                    rows={4}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                )}
              />
              <p className="text-xs text-gray-500">
                These instructions will be shown to customers when they select this payment method.
              </p>
            </div>
          </div>
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
} 
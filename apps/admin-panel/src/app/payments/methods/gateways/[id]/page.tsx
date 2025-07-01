'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Separator } from '@/components/ui/Separator';
import { useToast } from '@/hooks/useToast';
import { PaymentService } from '@/services/payment.service';
import { PaymentGateway, PaymentGatewayType } from '@/types/payment';

export default function ViewPaymentGatewayPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  
  // Fetch payment gateway data
  useEffect(() => {
    const fetchGateway = async () => {
      try {
        setIsLoading(true);
        const data = await PaymentService.getPaymentGatewayById(params.id);
        setGateway(data);
      } catch (error) {
        console.error('Failed to fetch payment gateway:', error);
        toast.error('Failed to load payment gateway');
        router.push('/payments/methods/gateways');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGateway();
  }, [params.id, router, toast]);

  const handleApiOperation = async (operation: () => Promise<any>, successMessage: string) => {
    try {
      setIsLoadingOperation(true);
      await operation();
      
      // Show success message
      toast.success(successMessage);
      
      // Refresh data
      const updatedGateway = await PaymentService.getPaymentGatewayById(params.id);
      setGateway(updatedGateway);
    } catch (error: any) {
      console.error('Operation failed:', error);
      toast.error(error?.message || 'Operation failed');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!gateway) return;
    
    await handleApiOperation(
      () => PaymentService.togglePaymentGatewayStatus(gateway.id, !gateway.isEnabled),
      `Payment gateway ${gateway.isEnabled ? 'disabled' : 'enabled'} successfully`
    );
  };

  const handleDelete = async () => {
    if (!gateway) return;
    
    if (window.confirm(`Are you sure you want to delete the payment gateway "${gateway.name}"?`)) {
      try {
        setIsLoadingOperation(true);
        await PaymentService.deletePaymentGateway(gateway.id);
        toast.success('Payment gateway deleted successfully');
        router.push('/payments/methods/gateways');
      } catch (error: any) {
        console.error('Failed to delete payment gateway:', error);
        toast.error(error?.message || 'Failed to delete payment gateway');
      } finally {
        setIsLoadingOperation(false);
      }
    }
  };

  const handleEdit = () => {
    if (!gateway) return;
    router.push(`/payments/methods/gateways/${gateway.id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!gateway) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Payment gateway not found
        </div>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/payments/methods/gateways')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payment Gateways
        </Button>
      </div>
    );
  }

  const getGatewayTypeLabel = (type: string): string => {
    switch (type) {
      case PaymentGatewayType.DIRECT:
        return 'Direct';
      case PaymentGatewayType.REDIRECT:
        return 'Redirect';
      case PaymentGatewayType.IFRAME:
        return 'Iframe';
      case PaymentGatewayType.OFFLINE:
        return 'Offline';
      default:
        return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Button 
            variant="ghost" 
            className="mb-2"
            onClick={() => router.push('/payments/methods/gateways')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payment Gateways
          </Button>
          <h1 className="text-2xl font-bold">{gateway.name}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isLoadingOperation}
            className="flex items-center gap-2"
          >
            {gateway.isEnabled ? (
              <>
                <ToggleRight className="h-4 w-4" />
                Disable
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" />
                Enable
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isLoadingOperation}
            className="flex items-center gap-2 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant={gateway.isEnabled ? 'success' : 'secondary'}>
          {gateway.isEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
        <Badge variant="outline">{getGatewayTypeLabel(gateway.type)}</Badge>
        <Badge variant="outline" className="text-xs font-mono">
          {gateway.code}
        </Badge>
      </div>
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gateway.description && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">{gateway.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Gateway Type</h3>
            <p className="mt-1">{getGatewayTypeLabel(gateway.type)}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Processing Time</h3>
            <p className="mt-1">{gateway.processingTime || 'Not specified'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
            <p className="mt-1">{new Date(gateway.createdAt).toLocaleString()}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            <p className="mt-1">{new Date(gateway.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Supported Currencies</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {gateway.supportedCurrencies.map((currency) => (
                <Badge key={currency} variant="outline">{currency}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Transaction Fee</h3>
            <p className="mt-1">
              {gateway.transactionFee 
                ? `${gateway.transactionFee} ${gateway.transactionFeeType === 'percentage' ? '%' : ''}`
                : 'No fee'
              }
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Minimum Amount</h3>
            <p className="mt-1">{gateway.minimumAmount || 'No minimum'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Maximum Amount</h3>
            <p className="mt-1">{gateway.maximumAmount || 'No maximum'}</p>
          </div>
          
          {gateway.paymentInstructions && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Payment Instructions</h3>
              <div className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                {gateway.paymentInstructions}
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {Object.keys(gateway.settings).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Gateway Configuration</h2>
          
          <div className="bg-gray-50 rounded-md p-4 overflow-auto">
            <pre className="text-sm">{JSON.stringify(gateway.settings, null, 2)}</pre>
          </div>
        </Card>
      )}
    </div>
  );
} 
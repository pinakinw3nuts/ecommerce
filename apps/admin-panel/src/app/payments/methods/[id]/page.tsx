'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CreditCard, 
  Check, 
  X,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PaymentService } from '@/services/payment.service';
import { PaymentMethod, PaymentMethodStatus } from '@/types/payment';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: {
    id: string;
  };
}

export default function PaymentMethodDetailPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const fetchPaymentMethod = async () => {
      setIsLoading(true);
      try {
        // For demo purposes, create a mock payment method
        const mockPaymentMethod: PaymentMethod = {
          id,
          userId: `user-${2000 + parseInt(id.split('-')[1])}`,
          type: 'card',
          provider: 'stripe',
          providerMethodId: `provider-method-${id.split('-')[1]}`,
          last4: '4242',
          expiryMonth: '12',
          expiryYear: '2025',
          brand: 'Visa',
          status: 'active',
          isDefault: true,
          metadata: {
            fingerprint: 'abc123xyz789',
            addressLine1: '123 Main St',
            addressLine2: 'Apt 101',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        };
        
        // In a real implementation, use the PaymentService
        // const response = await PaymentService.getPaymentMethodById(id);
        setPaymentMethod(mockPaymentMethod);
      } catch (error) {
        console.error('Failed to fetch payment method:', error);
        toast.error('Failed to load payment method details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentMethod();
  }, [id, toast]);
  
  const handleGoBack = () => {
    router.push('/payments/methods');
  };
  
  const handleSetDefault = async () => {
    if (!paymentMethod || paymentMethod.isDefault) return;
    
    setIsProcessing(true);
    try {
      await PaymentService.setPaymentMethodDefault(paymentMethod.id);
      toast.success('Payment method set as default');
      setPaymentMethod(prev => prev ? { ...prev, isDefault: true } : null);
    } catch (error) {
      console.error('Failed to set payment method as default:', error);
      toast.error('Failed to set payment method as default');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleToggleStatus = async () => {
    if (!paymentMethod) return;
    
    const newStatus = paymentMethod.status === PaymentMethodStatus.ACTIVE
      ? PaymentMethodStatus.INACTIVE
      : PaymentMethodStatus.ACTIVE;
    
    setIsProcessing(true);
    try {
      await PaymentService.updatePaymentMethodStatus(paymentMethod.id, newStatus);
      toast.success(`Payment method ${newStatus === PaymentMethodStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`);
      setPaymentMethod(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Failed to update payment method status:', error);
      toast.error('Failed to update payment method status');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeletePaymentMethod = async () => {
    if (!paymentMethod) return;
    
    if (paymentMethod.isDefault) {
      toast.error('Cannot delete the default payment method');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this payment method? This action cannot be undone.')) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await PaymentService.deletePaymentMethod(paymentMethod.id);
      toast.success('Payment method deleted successfully');
      router.push('/payments/methods');
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      toast.error('Failed to delete payment method');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!paymentMethod) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="outline" onClick={handleGoBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-semibold">Payment Method Not Found</h1>
          </div>
        </div>
        <p>The requested payment method could not be found. It may have been deleted or the ID is invalid.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleGoBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-gray-600 mr-2" />
            <h1 className="text-2xl font-semibold">Payment Method Details</h1>
          </div>
        </div>
        <div className="flex space-x-2">
          {!paymentMethod.isDefault && (
            <Button 
              onClick={handleSetDefault}
              disabled={isProcessing || paymentMethod.status === PaymentMethodStatus.INACTIVE}
            >
              <Check className="h-4 w-4 mr-2" /> Set As Default
            </Button>
          )}
          <Button 
            variant={paymentMethod.status === PaymentMethodStatus.ACTIVE ? 'outline' : 'default'}
            onClick={handleToggleStatus}
            disabled={isProcessing}
          >
            {paymentMethod.status === PaymentMethodStatus.ACTIVE ? (
              <>
                <X className="h-4 w-4 mr-2" /> Deactivate
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Activate
              </>
            )}
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDeletePaymentMethod}
            disabled={isProcessing || paymentMethod.isDefault}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Payment Method Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">ID</span>
              <span className="font-mono">{paymentMethod.id}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Type</span>
              <span className="capitalize">{paymentMethod.type}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Provider</span>
              <span className="capitalize">{paymentMethod.provider}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Brand</span>
              <span>{paymentMethod.brand}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Last 4</span>
              <span className="font-mono">•••• {paymentMethod.last4}</span>
            </div>
            {paymentMethod.type === 'card' && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Expires</span>
                <span>{paymentMethod.expiryMonth}/{paymentMethod.expiryYear}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Status</span>
              {paymentMethod.status === PaymentMethodStatus.ACTIVE ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Default</span>
              <span>
                {paymentMethod.isDefault ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Default
                  </span>
                ) : 'No'}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Created</span>
              <span>{formatDate(paymentMethod.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated</span>
              <span>{formatDate(paymentMethod.updatedAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Customer Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Customer ID</span>
              <span>{paymentMethod.userId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Provider Method ID</span>
              <span className="font-mono">{paymentMethod.providerMethodId}</span>
            </div>
            
            {paymentMethod.metadata && Object.keys(paymentMethod.metadata).length > 0 && (
              <div className="pt-4">
                <h3 className="text-md font-medium mb-2">Address Information</h3>
                {paymentMethod.metadata.addressLine1 && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Address Line 1</span>
                    <span>{paymentMethod.metadata.addressLine1}</span>
                  </div>
                )}
                {paymentMethod.metadata.addressLine2 && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Address Line 2</span>
                    <span>{paymentMethod.metadata.addressLine2}</span>
                  </div>
                )}
                {paymentMethod.metadata.city && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">City</span>
                    <span>{paymentMethod.metadata.city}</span>
                  </div>
                )}
                {paymentMethod.metadata.state && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">State</span>
                    <span>{paymentMethod.metadata.state}</span>
                  </div>
                )}
                {paymentMethod.metadata.postalCode && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Postal Code</span>
                    <span>{paymentMethod.metadata.postalCode}</span>
                  </div>
                )}
                {paymentMethod.metadata.country && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Country</span>
                    <span>{paymentMethod.metadata.country}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
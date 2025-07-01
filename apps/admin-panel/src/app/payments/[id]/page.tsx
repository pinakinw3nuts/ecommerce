'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CreditCard, 
  Edit, 
  Trash2,
  Download,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PaymentService } from '@/services/payment.service';
import { Payment, PaymentStatus } from '@/types/payment';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: {
    id: string;
  };
}

export default function PaymentDetailPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const toast = useToast();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  
  useEffect(() => {
    const fetchPayment = async () => {
      setIsLoading(true);
      try {
        // For demo purposes, create a mock payment
        const mockPayment: Payment = {
          id,
          orderId: `order-${1000 + parseInt(id.split('-')[1])}`,
          userId: `user-${2000 + parseInt(id.split('-')[1])}`,
          provider: 'stripe',
          status: PaymentStatus.COMPLETED,
          transactionId: `tx-${Date.now()}-${id.split('-')[1]}`,
          currency: 'USD',
          amount: 199.99,
          providerPaymentId: `provider-${id.split('-')[1]}`,
          providerResponse: null,
          paymentMethodId: `pm-${id.split('-')[1]}`,
          paymentMethod: {
            id: `pm-${id.split('-')[1]}`,
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
            metadata: {},
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          metadata: {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          refunds: [],
          refundedAmount: 0,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        };
        
        // In a real implementation, use the PaymentService
        // const response = await PaymentService.getPaymentById(id);
        setPayment(mockPayment);
      } catch (error) {
        console.error('Failed to fetch payment:', error);
        toast.error('Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPayment();
  }, [id, toast]);
  
  const handleGoBack = () => {
    router.push('/payments');
  };
  
  const handleRefund = async () => {
    if (!payment) return;
    
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    
    if (!refundReason) {
      toast.error('Please enter a reason for the refund');
      return;
    }
    
    const refundAmountNumber = parseFloat(refundAmount);
    if (refundAmountNumber > (payment.amount - payment.refundedAmount)) {
      toast.error('Refund amount cannot exceed the available amount');
      return;
    }
    
    setIsProcessing(true);
    try {
      await PaymentService.refundPayment({
        paymentId: payment.id,
        amount: refundAmountNumber,
        reason: refundReason
      });
      
      toast.success('Refund processed successfully');
      
      // Update the payment data
      setPayment(prev => {
        if (!prev) return null;
        return {
          ...prev,
          refundedAmount: prev.refundedAmount + refundAmountNumber,
          refunds: [
            ...prev.refunds,
            {
              id: `refund-${Date.now()}`,
              paymentId: prev.id,
              amount: refundAmountNumber,
              status: 'completed',
              reason: refundReason,
              requestedBy: 'admin',
              transactionId: `refund-tx-${Date.now()}`,
              metadata: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        };
      });
      
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeletePayment = async () => {
    if (!payment) return;
    
    if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await PaymentService.deletePayment(payment.id);
      toast.success('Payment deleted successfully');
      router.push('/payments');
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast.error('Failed to delete payment');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!payment) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="outline" onClick={handleGoBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-semibold">Payment Not Found</h1>
          </div>
        </div>
        <p>The requested payment could not be found. It may have been deleted or the ID is invalid.</p>
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
            <h1 className="text-2xl font-semibold">Payment Details</h1>
          </div>
        </div>
        <div className="flex space-x-2">
          {payment.status === PaymentStatus.COMPLETED && payment.refundedAmount < payment.amount && (
            <Button 
              onClick={() => setShowRefundModal(true)}
              disabled={isProcessing}
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Refund
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={handleDeletePayment}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2 text-red-500" /> Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Payment Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">ID</span>
              <span className="font-mono">{payment.id}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono">{payment.transactionId || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                {payment.status}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency
                }).format(payment.amount)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Refunded</span>
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency
                }).format(payment.refundedAmount)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Created At</span>
              <span>{formatDate(payment.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated At</span>
              <span>{formatDate(payment.updatedAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Order & Customer Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Order ID</span>
              <span className="font-medium">{payment.orderId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Customer ID</span>
              <span>{payment.userId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Provider</span>
              <span className="capitalize">{payment.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method</span>
              <span>
                {payment.paymentMethod.brand} •••• {payment.paymentMethod.last4}
                {payment.paymentMethod.type === 'card' && (
                  <span className="ml-1">({payment.paymentMethod.expiryMonth}/{payment.paymentMethod.expiryYear})</span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        {payment.metadata && Object.keys(payment.metadata).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-lg font-medium mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(payment.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b pb-2">
                  <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-mono text-sm">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h2 className="text-lg font-medium mb-4">Refund History</h2>
          {payment.refunds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payment.refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td className="px-4 py-3 text-sm font-mono">{refund.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: payment.currency
                        }).format(refund.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(refund.status)}`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(refund.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">{refund.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No refunds have been issued for this payment.</p>
          )}
        </div>
      </div>
      
      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Process Refund</h3>
                    <div className="mt-2 space-y-4">
                      <div>
                        <label htmlFor="refundAmount" className="block text-sm font-medium text-gray-700">Refund Amount</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="refundAmount"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0.00"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            min="0.01"
                            max={payment.amount - payment.refundedAmount}
                            step="0.01"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">{payment.currency}</span>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Available for refund: {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: payment.currency
                          }).format(payment.amount - payment.refundedAmount)}
                        </p>
                      </div>
                      <div>
                        <label htmlFor="refundReason" className="block text-sm font-medium text-gray-700">Reason for Refund</label>
                        <textarea
                          id="refundReason"
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          rows={3}
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRefund}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Process Refund'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRefundModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
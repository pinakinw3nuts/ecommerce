'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  gateway: 'Stripe' | 'Razorpay' | 'COD' | 'Invoice';
  status: 'PAID' | 'FAILED' | 'REFUNDED';
  timestamp: string;
  refundStatus?: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    reason?: string;
    refundedAt?: string;
  };
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PaymentsPage() {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  
  const { data: payments, error, mutate } = useSWR<Payment[]>('/api/payments', fetcher);

  const handleRefund = async (payment: Payment) => {
    if (!confirm('Are you sure you want to initiate a refund?')) return;

    try {
      setIsRefunding(true);
      const response = await fetch(`/api/payments/${payment.id}/refund`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to initiate refund');
      
      await mutate(); // Refresh the payments list
      setSelectedPayment(null); // Close the modal
    } catch (error) {
      console.error('Error initiating refund:', error);
      alert('Failed to initiate refund. Please try again.');
    } finally {
      setIsRefunding(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load payments</p>
      </div>
    );
  }

  if (!payments) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
      </div>

      {/* Payments Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gateway
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.orderId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${payment.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.gateway}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(payment.timestamp), 'PPpp')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Refund Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-semibold">Payment Details</h2>
            
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Order ID</dt>
                <dd className="text-sm font-medium">{selectedPayment.orderId}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Amount</dt>
                <dd className="text-sm font-medium">${selectedPayment.amount.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Gateway</dt>
                <dd className="text-sm font-medium">{selectedPayment.gateway}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="text-sm font-medium">{selectedPayment.status}</dd>
              </div>
              {selectedPayment.refundStatus && (
                <div>
                  <dt className="text-sm text-gray-500">Refund Status</dt>
                  <dd className="text-sm font-medium">{selectedPayment.refundStatus.status}</dd>
                  {selectedPayment.refundStatus.reason && (
                    <dd className="text-sm text-gray-500">{selectedPayment.refundStatus.reason}</dd>
                  )}
                  {selectedPayment.refundStatus.refundedAt && (
                    <dd className="text-sm text-gray-500">
                      Refunded on {format(new Date(selectedPayment.refundStatus.refundedAt), 'PPpp')}
                    </dd>
                  )}
                </div>
              )}
            </dl>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </Button>
              {selectedPayment.status === 'PAID' && !selectedPayment.refundStatus && (
                <Button
                  variant="destructive"
                  onClick={() => handleRefund(selectedPayment)}
                  disabled={isRefunding}
                >
                  {isRefunding ? 'Processing...' : 'Initiate Refund'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
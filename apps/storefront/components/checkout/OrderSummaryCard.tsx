import React from 'react';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { OrderPreview } from '@/services/checkout';

interface OrderSummaryCardProps {
  orderPreview: OrderPreview | null;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ orderPreview }) => {
  if (!orderPreview) {
    return (
      <Card className="shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
        <p className="text-gray-600">Loading order details...</p>
      </Card>
    );
  }

  const { subtotal, shippingCost, tax, discount, total } = orderPreview;

  return (
    <Card className="shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-700">Subtotal:</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Shipping:</span>
          <span className="font-medium">{formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Tax:</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="text-gray-700">Discount:</span>
            <span className="font-medium">-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-xl font-bold">{formatPrice(total)}</span>
        </div>
      </div>
    </Card>
  );
}; 
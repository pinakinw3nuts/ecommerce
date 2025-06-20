'use client';

import { Check, X } from 'lucide-react';
import { formatPrice } from '@/utils/formatters';

interface AppliedCouponProps {
  coupon: {
    code: string;
    type: 'percentage' | 'fixed' | 'shipping';
    value: number;
    description: string;
    discountAmount?: number;
  };
  onRemove?: () => void;
  className?: string;
  compact?: boolean;
}

export function AppliedCoupon({ 
  coupon, 
  onRemove, 
  className = '',
  compact = false
}: AppliedCouponProps) {
  // Format the discount value based on the type
  const formatDiscount = () => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% off`;
    } else if (coupon.type === 'fixed') {
      return `${formatPrice(coupon.value)} off`;
    } else if (coupon.type === 'shipping') {
      return 'Free Shipping';
    }
    return '';
  };

  if (compact) {
    return (
      <div className={`flex items-center justify-between text-sm text-green-600 ${className}`}>
        <div className="flex items-center">
          <Check className="h-4 w-4 mr-1" />
          <span>{coupon.code}</span>
          {coupon.discountAmount !== undefined && (
            <span className="ml-1">({formatPrice(coupon.discountAmount)} off)</span>
          )}
        </div>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="text-gray-500 hover:text-red-500"
            aria-label="Remove coupon"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-green-50 border border-green-100 rounded-md p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium flex items-center text-green-700">
            <Check className="h-4 w-4 mr-1" />
            {coupon.code}
          </div>
          <div className="text-sm text-green-600">{coupon.description}</div>
          <div className="text-sm text-green-600">
            {formatDiscount()}
            {coupon.discountAmount !== undefined && (
              <span className="ml-1">({formatPrice(coupon.discountAmount)} off)</span>
            )}
          </div>
        </div>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500"
            aria-label="Remove coupon"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
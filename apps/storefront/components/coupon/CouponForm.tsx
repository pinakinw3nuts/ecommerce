'use client';

import { useState } from 'react';
import { Check, AlertCircle, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

interface CouponFormProps {
  onApply?: (coupon: any) => void;
  orderTotal: number;
  compact?: boolean;
  className?: string;
}

export interface CouponResponse {
  valid: boolean;
  coupon: {
    code: string;
    type: 'percentage' | 'fixed' | 'shipping';
    value: number;
    minOrderValue: number;
    description: string;
    discountAmount: number;
  };
}

export default function CouponForm({ onApply, orderTotal, compact = false, className = '' }: CouponFormProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [couponResult, setCouponResult] = useState<CouponResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) return;
    
    try {
      setLoading(true);
      setMessage('');
      setMessageType(null);
      setCouponResult(null);
      
      // Log the request for debugging
      console.log('Validating coupon:', trimmedCode, 'for order total:', orderTotal);
      
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: trimmedCode,
          orderTotal,
          userId: 'guest-user',
          productIds: []
        }),
      });
      
      const data = await response.json();
      
      // Log the response for debugging
      console.log('Coupon validation response:', data);
      
      if (response.ok && data.valid) {
        setMessage('Coupon applied successfully!');
        setMessageType('success');
        setCouponResult(data);
        
        // Call the onApply callback if provided
        if (onApply) {
          onApply(data.coupon);
        }
        
        // Clear the input
        setCouponCode('');
      } else {
        const errorMessage = data.error || 'This coupon is not valid or cannot be applied to your order.';
        setMessage(errorMessage);
        setMessageType('error');
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      setMessage('Failed to validate coupon. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
    
    // Clear success message after 5 seconds, but keep error messages
    if (messageType === 'success') {
      setTimeout(() => {
        setMessage('');
        setMessageType(null);
      }, 5000);
    }
  };

  return (
    <div className={`${className}`}>
      {!compact && (
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Tag className="h-5 w-5 mr-2 text-[#D23F57]" />
          Apply Coupon
        </h3>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D23F57] focus:border-[#D23F57]"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-[#D23F57] hover:bg-[#b8354a] text-white px-4 py-2 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
            disabled={loading || !couponCode.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              'Apply'
            )}
          </button>
        </div>
        
        {!compact && (
          <p className="text-xs text-gray-500 mt-1">
            Try test codes: <span className="font-medium">TEST10</span> (10% off) or <span className="font-medium">FLAT20</span> ($20 off)
          </p>
        )}
        
        {message && (
          <div className={`text-sm mt-2 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'} flex items-start`}>
            {messageType === 'success' ? (
              <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            )}
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
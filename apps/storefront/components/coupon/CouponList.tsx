'use client';

import { useState, useEffect } from 'react';
import { Tag, AlertCircle, Search, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountAmount: number;
  discountType: string;
  minimumPurchaseAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CouponListProps {
  onSelectCoupon?: (code: string) => void;
  className?: string;
  limit?: number;
}

export default function CouponList({ onSelectCoupon, className = '', limit }: CouponListProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/coupons', {
        cache: 'no-store' // Don't cache to ensure fresh data
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch coupons: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.coupons || !Array.isArray(data.coupons)) {
        console.error('Invalid coupon data format:', data);
        throw new Error('Invalid data format received from server');
      }
      
      // Log the received data
      console.log(`Received ${data.coupons.length} coupons from API`);
      
      setCoupons(data.coupons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCoupons();
  }, []);

  // Format discount value for display
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountAmount}%`;
    } else if (coupon.discountType === 'FIXED') {
      return formatPrice(coupon.discountAmount);
    } else if (coupon.discountType === 'SHIPPING') {
      return 'Free Shipping';
    }
    return formatPrice(coupon.discountAmount);
  };

  // Filter only active coupons and apply limit if provided
  const displayCoupons = coupons
    .filter(coupon => coupon.isActive)
    .slice(0, limit);

  if (loading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D23F57]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex flex-col items-center ${className}`}>
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error loading coupons: {error}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchCoupons}
          className="mt-2"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (displayCoupons.length === 0) {
    return (
      <div className={`text-center py-6 text-gray-500 ${className}`}>
        <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm">No coupons available at this time</p>
        <p className="text-xs text-gray-400 mt-1">Check back later for special offers and discounts</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchCoupons}
          className="mt-3"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Tag className="h-5 w-5 mr-2 text-[#D23F57]" />
          Available Coupons ({displayCoupons.length})
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchCoupons}
          className="text-gray-500"
        >
          <RefreshCcw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-3">
        {displayCoupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-lg border overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b">
              <div className="flex justify-between items-center">
                <h4 className="font-bold">{coupon.code}</h4>
                <span className="text-[#D23F57] font-medium">{formatDiscount(coupon)}</span>
              </div>
            </div>
            
            <div className="p-3">
              <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
              
              {coupon.minimumPurchaseAmount > 0 && (
                <p className="text-xs text-gray-500 mb-2">
                  Minimum order: {formatPrice(coupon.minimumPurchaseAmount)}
                </p>
              )}
              
              <p className="text-xs text-gray-500">
                Valid until: {new Date(coupon.endDate).toLocaleDateString()}
              </p>
              
              {onSelectCoupon && (
                <Button
                  className="w-full mt-2 text-sm py-1 h-auto bg-[#D23F57] hover:bg-[#b8354a] text-white"
                  onClick={() => onSelectCoupon(coupon.code)}
                >
                  Use Coupon
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
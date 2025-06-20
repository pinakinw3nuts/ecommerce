import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { formatPrice } from '@/utils/formatters';
import { OrderPreview } from '@/services/checkout';
import { CouponForm } from '../coupons/CouponForm';
import { AppliedCoupon } from '@/components/coupons/AppliedCoupon';
import { useCart } from '@/contexts/CartContext';
import { useCheckout } from './CheckoutProvider';

interface OrderSummaryCardProps {
  orderPreview: OrderPreview | null;
  showCouponInput?: boolean;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ 
  orderPreview, 
  showCouponInput = true 
}) => {
  const { coupon, applyCoupon, removeCoupon } = useCart();
  const { calculateOrderPreview, checkoutSession } = useCheckout();
  const [showCouponForm, setShowCouponForm] = useState(false);
  
  if (!orderPreview) {
    return (
      <Card className="p-4 mt-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-6 bg-gray-300 rounded w-1/3 mt-6"></div>
        </div>
      </Card>
    );
  }

  const { subtotal, shippingCost, tax, discount, total } = orderPreview;

  // Handle coupon application and recalculate order preview
  const handleApplyCoupon = (appliedCoupon: any) => {
    applyCoupon(appliedCoupon.code);
    setShowCouponForm(false);
    
    // Recalculate order preview with the new coupon
    if (checkoutSession?.userId && checkoutSession?.cartSnapshot) {
      const cartItems = (checkoutSession.cartSnapshot as any[]).map(item => ({
        ...item,
        productId: item.productId || item.id,
      }));
      calculateOrderPreview(
        checkoutSession.userId,
        cartItems,
        appliedCoupon.code
      );
    }
  };
  
  // Handle coupon removal and recalculate order preview
  const handleRemoveCoupon = () => {
    removeCoupon();
    
    // Recalculate order preview without coupon
    if (checkoutSession?.userId && checkoutSession?.cartSnapshot) {
      const cartItems = (checkoutSession.cartSnapshot as any[]).map(item => ({
        ...item,
        productId: item.productId || item.id,
      }));
      calculateOrderPreview(
        checkoutSession.userId,
        cartItems
      );
    }
  };

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
        
        {/* Coupon Section */}
        {showCouponInput && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {coupon ? (
              <AppliedCoupon 
                coupon={coupon} 
                onRemove={handleRemoveCoupon} 
                className="mb-3"
              />
            ) : showCouponForm ? (
              <CouponForm 
                onApply={handleApplyCoupon}
                orderTotal={subtotal}
                onCancel={() => setShowCouponForm(false)}
              />
            ) : (
              <button 
                onClick={() => setShowCouponForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                + Add coupon code
              </button>
            )}
          </div>
        )}
        
        <div className="pt-4 border-t border-gray-200 flex justify-between items-center mt-4">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-xl font-bold">{formatPrice(total)}</span>
        </div>
      </div>
    </Card>
  );
};
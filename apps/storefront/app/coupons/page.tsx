'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Tag, AlertCircle, Check, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import CouponList from '@/components/coupon/CouponList';
import CouponForm from '@/components/coupon/CouponForm';
import AppliedCoupon from '@/components/coupon/AppliedCoupon';

export default function CouponsPage() {
  const [verifyAmount, setVerifyAmount] = useState(100);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const { subtotal, applyCoupon } = useCart();
  const [couponTypes, setCouponTypes] = useState<string[]>([]);
  
  // Fetch available coupon types for help section
  useEffect(() => {
    async function fetchCouponTypes() {
      try {
        const response = await fetch('/api/coupons');
        
        if (response.ok) {
          const data = await response.json();
          if (data.coupons && Array.isArray(data.coupons)) {
            // Extract unique discount types with proper typing
            const types = [...new Set(data.coupons.map((c: any) => c.discountType))] as string[];
            setCouponTypes(types);
          }
        }
      } catch (error) {
        console.error('Error fetching coupon types:', error);
      }
    }
    
    fetchCouponTypes();
  }, []);

  const handleSelectCoupon = (code: string) => {
    // Set the code to the verification form
    const verifyForm = document.getElementById('coupon-verify-form');
    if (verifyForm) {
      // Scroll to the verify form
      verifyForm.scrollIntoView({ behavior: 'smooth' });

      // Find the input field and set its value
      const input = verifyForm.querySelector('input[type="text"]') as HTMLInputElement;
      if (input) {
        input.value = code;
        
        // Focus the input to help the user see that the code was added
        input.focus();
        
        // Trigger validation if there's a submit button
        const button = verifyForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (button) {
          // Simulate a form submission
          const form = input.closest('form');
          if (form) {
            const event = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(event);
          }
        }
      }
    }
  };

  const handleVerifySuccess = (coupon: any) => {
    setSelectedCoupon(coupon);
  };

  const handleApplyToCart = () => {
    if (selectedCoupon) {
      applyCoupon(selectedCoupon.code);
      
      // Show success message
      alert('Coupon applied to your cart!');
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Tag className="h-6 w-6 mr-2 text-[#D23F57]" />
        Coupons & Discounts
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Coupon List */}
          <CouponList 
            onSelectCoupon={handleSelectCoupon}
            className="mb-8"
          />
        </div>

        <div className="lg:col-span-1">
          {/* Coupon Verification Tool */}
          <div id="coupon-verify-form" className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Verify a Coupon</h2>
            
            <div className="mb-4">
              <label htmlFor="orderAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Order Amount
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <input
                  id="orderAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={verifyAmount}
                  onChange={(e) => setVerifyAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D23F57] focus:border-[#D23F57]"
                />
                <Button 
                  type="button"
                  variant="outline"
                  className="ml-2 whitespace-nowrap"
                  onClick={() => setVerifyAmount(subtotal)}
                >
                  Use Cart Total
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter an order amount to see how much you'll save with a coupon.
              </p>
            </div>
            
            <CouponForm 
              orderTotal={verifyAmount} 
              onApply={handleVerifySuccess}
            />
            
            {selectedCoupon && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Verified Coupon</h3>
                <AppliedCoupon 
                  coupon={selectedCoupon} 
                  onRemove={() => setSelectedCoupon(null)}
                />
                
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Order Amount:</span>
                      <span className="font-medium">{formatPrice(verifyAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between mb-1 text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-{formatPrice(selectedCoupon.discountAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between font-medium pt-1 border-t border-gray-200 mt-1">
                      <span>Final Amount:</span>
                      <span>{formatPrice(verifyAmount - selectedCoupon.discountAmount)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  className="w-full mt-4 bg-[#D23F57] hover:bg-[#b8354a] text-white"
                  onClick={handleApplyToCart}
                >
                  Apply to My Cart
                </Button>
              </div>
            )}
          </div>
          
          {/* Help Section */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-medium mb-3">How Coupons Work</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Enter a coupon code during checkout or in your cart</span>
              </li>
              
              {couponTypes.includes('PERCENTAGE') && (
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Percentage discounts reduce your order subtotal by the specified percentage</span>
                </li>
              )}
              
              {couponTypes.includes('FIXED') && (
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Fixed amount discounts subtract a specific amount from your order</span>
                </li>
              )}
              
              {couponTypes.includes('SHIPPING') && (
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Shipping coupons eliminate shipping costs on your order</span>
                </li>
              )}
              
              <li className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Some coupons have minimum order requirements</span>
              </li>
              
              <li className="flex items-start">
                <AlertCircle className="h-4 w-4 text-[#D23F57] mr-2 mt-0.5" />
                <span>Only one coupon can be applied per order</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
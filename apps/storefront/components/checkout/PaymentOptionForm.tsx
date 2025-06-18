import React, { useState } from 'react';
import { CardContent } from '@/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { useCheckout } from './CheckoutProvider';
import * as checkoutService from '@/services/checkout';
import toast from 'react-hot-toast';

// Payment method icons - import or use inline SVGs
const PaymentMethodIcons = {
  credit_card: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  paypal: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M19.5 6.5C19.5 7 19.3 7.5 19 8C18.5 9 17.6 9.33333 16.5 9.5C16.3333 9.5 16.1667 9.5 16 9.5H13C12.7 9.5 12.5 9.7 12.5 10C12.5 10.3 12.7 10.5 13 10.5H15.5C16.1667 10.5 16.8333 10.6667 17.5 11C18.1667 11.3333 18.5 11.8333 18.5 12.5C18.5 13 18.3333 13.5 18 14C17.6667 14.5 17.1667 14.8333 16.5 15H15.5C15.2 15.3 14.8333 15.5 14.5 15.5H12C10.6667 15.5 9.5 15 8.5 14C8.16667 13.6667 7.9 13.3 7.7 12.9C7.5 12.5 7.33333 12.0667 7.2 11.6C7.06667 11.1333 7 10.6333 7 10.1V10L7.1 9.5C7.36667 8.16667 8.03333 7.16667 9.1 6.5C10.1667 5.83333 11.4 5.5 12.8 5.5H14C15.2 5.5 16.3 5.33333 17.3 5C18.3 4.66667 19 4 19.5 3V6.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 15.5L5.5 20.5H8.5C8.83333 20.5 9.08333 20.2833 9.25 19.85C9.41667 19.4167 9.58333 18.8333 9.75 18.1C9.91667 17.3667 10.0833 16.6167 10.25 15.85C10.4167 15.0833 10.5833 14.4167 10.75 13.85C10.9167 13.2833 11.0833 12.9167 11.25 12.75C11.4167 12.5833 11.6667 12.5 12 12.5H16C17.3333 12.5 18.3333 13 19 14C19.6667 15 19.8333 16.1667 19.5 17.5C19.1667 18.8333 18.5 19.8333 17.5 20.5H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  apple_pay: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 13.5c.5-1 .5-2 0-3" />
      <path d="M18.5 12c-.5-1.5-.5-3 0-4.5" />
      <path d="M9 13c.9 1 1.9 1.8 3 2.3a4.8 4.8 0 0 0 6.3-1.7c3.7-5.7-1-13.2-8.2-12.7-1.3.1-2.6.5-3.7 1.2A6 6 0 0 0 4 7.2c-1 3 1 6.7 3.8 7.8" />
      <path d="M11 15c1.2 1.5 2.3 3 3.8 3.5a4.9 4.9 0 0 0 4.2-.5" />
      <path d="M15 18.9c1 .7 2 1 3 1.1h1.3" />
    </svg>
  ),
  cash_on_delivery: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
      <circle cx="7" cy="12" r="2"></circle>
      <line x1="12" y1="12" x2="22" y2="12"></line>
    </svg>
  )
};

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export const PaymentOptionForm: React.FC = () => {
  const { paymentMethod, setPaymentMethod, shippingMethod, nextStep, prevStep } = useCheckout();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(paymentMethod || 'credit_card');
  const [isUpdating, setIsUpdating] = useState(false);

  // Available payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'credit_card',
      name: 'Credit / Debit Card',
      description: 'Pay with Visa, Mastercard, etc.',
      icon: PaymentMethodIcons.credit_card
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay using your PayPal account',
      icon: PaymentMethodIcons.paypal
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      description: 'Quick and secure payment with Apple',
      icon: PaymentMethodIcons.apple_pay
    },
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      description: 'Pay with cash upon delivery',
      icon: PaymentMethodIcons.cash_on_delivery
    }
  ];

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const handleSubmit = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setIsUpdating(true);
      setPaymentMethod(selectedPaymentMethod);
      toast.success('Payment method selected');
      nextStep();
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // If shipping method isn't set, redirect back to shipping method step
  if (!shippingMethod) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-12">
          <p className="mb-4">Please select a shipping method first.</p>
          <Button onClick={prevStep}>Go Back to Shipping Method</Button>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      <h2 className="text-xl font-bold mb-4">Select Payment Method</h2>
      
      <RadioGroup 
        value={selectedPaymentMethod} 
        onValueChange={handlePaymentMethodChange}
        className="space-y-3"
      >
        {paymentMethods.map((method) => (
          <div 
            key={method.id}
            className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => handlePaymentMethodChange(method.id)}
          >
            <RadioGroupItem value={method.id} id={method.id} />
            <Label 
              htmlFor={method.id} 
              className="flex flex-1 items-center cursor-pointer"
            >
              <div className="mr-3 text-gray-600">
                {method.icon}
              </div>
              <div>
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-gray-500">{method.description}</div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      <div className="mt-8 flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={isUpdating}
        >
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isUpdating || !selectedPaymentMethod}
        >
          {isUpdating ? 'Processing...' : 'Continue to Review'}
        </Button>
      </div>
    </CardContent>
  );
}; 
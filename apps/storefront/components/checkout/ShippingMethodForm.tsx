import React, { useState, useEffect } from 'react';
import { CardContent } from '@/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { useCheckout } from './CheckoutProvider';
import * as checkoutService from '@/services/checkout';
import * as shippingService from '@/services/shipping';
import { ShippingMethod, DEFAULT_SHIPPING_METHODS } from '@/types/shipping';
import toast from 'react-hot-toast';

export const ShippingMethodForm: React.FC = () => {
  const { 
    shippingAddress, 
    shippingMethod, 
    setShippingMethod, 
    nextStep, 
    prevStep,
    orderPreview
  } = useCheckout();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>(shippingMethod || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch shipping methods from the API when shipping address changes
  useEffect(() => {
    const fetchShippingMethods = async () => {
      if (!shippingAddress) {
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Use shipping address to fetch available shipping methods
        const address = {
          pincode: shippingAddress.zipCode,
          country: shippingAddress.country
        };
        
        // Call the shipping service to get available methods for this pincode
        const availableMethods = await shippingService.getAvailableShippingMethods(address);
        
        if (availableMethods && availableMethods.length > 0) {
          setShippingMethods(availableMethods);
          
          // Pre-select the method if already chosen or default to first available
          if (shippingMethod && availableMethods.some(m => m.method === shippingMethod)) {
            setSelectedMethod(shippingMethod);
          } else {
            setSelectedMethod(availableMethods[0].method);
          }
        } else {
          // If no shipping methods available, use defaults as fallback
          console.warn('No shipping methods available for this location. Using default methods.');
          setShippingMethods(DEFAULT_SHIPPING_METHODS);
          setSelectedMethod(DEFAULT_SHIPPING_METHODS[0].method);
        }
      } catch (error) {
        console.error('Error in shipping methods setup:', error);
        toast.error('Failed to load shipping options. Using default options.');
        setShippingMethods(DEFAULT_SHIPPING_METHODS);
        setSelectedMethod(DEFAULT_SHIPPING_METHODS[0].method);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShippingMethods();
  }, [shippingAddress, shippingMethod]);

  useEffect(() => {
    if (isUpdating && orderPreview) {
      setIsUpdating(false);
      toast.success('Shipping method selected');
      nextStep();
    }
  }, [orderPreview, isUpdating, nextStep]);

  const handleSelectShippingMethod = (methodId: string) => {
    setSelectedMethod(methodId);
    setShippingMethod(methodId);
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error('Please select a shipping method');
      return;
    }
    setIsUpdating(true);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // If shipping address isn't set, redirect back to address step
  if (!shippingAddress) {
    return (
      <CardContent className="p-6">
        <div className="text-center py-12">
          <p className="mb-4">Please provide your shipping address first.</p>
          <Button onClick={prevStep}>Go Back to Shipping Address</Button>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      <h2 className="text-xl font-bold mb-4">Select Shipping Method</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading shipping methods...</span>
        </div>
      ) : shippingMethods.length === 0 ? (
        <div className="text-center py-8 text-red-500">
          <p>No shipping methods available for your location.</p>
          <p className="mt-2">Please check your shipping address.</p>
          <Button onClick={prevStep} className="mt-4">
            Update Shipping Address
          </Button>
        </div>
      ) : (
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={handleSelectShippingMethod}
          className="space-y-3"
        >
          {shippingMethods.map((method, index) => (
            <div 
              key={`${method.method}-${index}`}
              className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelectShippingMethod(method.method)}
            >
              <RadioGroupItem value={method.method} id={method.method} />
              <Label 
                htmlFor={method.method} 
                className="flex flex-1 justify-between items-center cursor-pointer"
              >
                <div>
                  <div className="font-medium">{method.label}</div>
                  <div className="text-sm text-gray-500">Delivery in {method.estimatedDays} days</div>
                  <div className="text-sm text-gray-500">{method.description}</div>
                </div>
                <div className="font-medium">{formatPrice(method.price)}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
      
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
          disabled={isLoading || isUpdating || shippingMethods.length === 0 || !selectedMethod}
        >
          {isUpdating ? 'Saving...' : 'Continue to Payment'}
        </Button>
      </div>
    </CardContent>
  );
}; 
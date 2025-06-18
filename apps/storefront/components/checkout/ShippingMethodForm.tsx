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
  const { shippingAddress, shippingMethod, setShippingMethod, nextStep, prevStep } = useCheckout();
  const [shippingMethods, setShippingMethods] = useState<Array<{
    method: string;
    label: string;
    description: string;
    price: number;
    estimatedDays: number;
  }>>(DEFAULT_SHIPPING_METHODS); // Initialize with default methods
  const [selectedMethod, setSelectedMethod] = useState<string>(shippingMethod || (DEFAULT_SHIPPING_METHODS.length > 0 ? DEFAULT_SHIPPING_METHODS[0].method : ''));
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Remove useEffect for fetching shipping methods for now, use mock data directly
  /*
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
        
        let availableMethods = DEFAULT_SHIPPING_METHODS;

        try {
          // Try to get shipping methods from the service
          const serviceMethods = await shippingService.getAvailableShippingMethods(address);
          if (serviceMethods && serviceMethods.length > 0) {
            const mappedMethods = serviceMethods.map(m => ({
              method: m.method || '',
              label: `${m.carrier || ''} ${m.method || ''}`.trim(),
              description: `Delivery in ${m.estimatedDays || 'N/A'} days`,
              price: typeof m.cost === 'number' ? m.cost : 0,
              estimatedDays: parseInt(m.estimatedDays || '0')
            }));
            // Filter out methods with empty 'method' field to ensure proper selection
            availableMethods = mappedMethods.filter(m => m.method.length > 0);
          } else {
            console.warn('Shipping service returned no methods. Using default methods.');
            availableMethods = DEFAULT_SHIPPING_METHODS;
          }
        } catch (serviceError) {
          console.warn('Error fetching shipping methods from service. Using default methods:', serviceError);
          availableMethods = DEFAULT_SHIPPING_METHODS;
        }

        setShippingMethods(availableMethods);
        
        // Pre-select the method if already chosen or default to first available
        if (shippingMethod && availableMethods.some(m => m.method === shippingMethod)) {
          setSelectedMethod(shippingMethod);
        } else if (availableMethods.length > 0) {
          setSelectedMethod(availableMethods[0].method);
        }
      } catch (error) {
        console.error('Error in shipping methods setup:', error);
        toast.error('Failed to load shipping options. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShippingMethods();
  }, [shippingAddress]);
  */

  // No longer need a separate useEffect for setting selected method, as it's done during initialization

  const handleSelectShippingMethod = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error('Please select a shipping method');
      return;
    }

    try {
      setIsUpdating(true);
      setShippingMethod(selectedMethod);
      toast.success('Shipping method selected');
      nextStep();
    } catch (error) {
      console.error('Error updating shipping method:', error);
      toast.error('Failed to update shipping method. Please try again.');
    } finally {
      setIsUpdating(false);
    }
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
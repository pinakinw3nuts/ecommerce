import React from 'react';
import { useCheckout } from './CheckoutProvider';
import { Check, CreditCard, MapPin, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutStepperProps {
  children: React.ReactNode[];
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ children }) => {
  const {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    shippingAddress,
    shippingMethod,
    paymentMethod,
    isLoadingSession,
    canProceedToNextStep,
  } = useCheckout();

  // Define the checkout steps
  const steps = [
    {
      id: 'shipping-address',
      title: 'Shipping Address',
      description: 'Where to ship your order',
      icon: <MapPin className="h-5 w-5" />,
      isCompleted: !!shippingAddress,
      isActive: currentStep === 0
    },
    {
      id: 'shipping-method',
      title: 'Shipping Method',
      description: 'Choose your shipping option',
      icon: <Truck className="h-5 w-5" />,
      isCompleted: !!shippingMethod,
      isActive: currentStep === 1
    },
    {
      id: 'payment',
      title: 'Payment',
      description: 'Select payment method',
      icon: <CreditCard className="h-5 w-5" />,
      isCompleted: !!paymentMethod,
      isActive: currentStep === 2
    },
    {
      id: 'review',
      title: 'Review & Place Order',
      description: 'Complete your purchase',
      icon: <Package className="h-5 w-5" />,
      isCompleted: false,
      isActive: currentStep === 3
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="hidden md:flex justify-between w-full mb-4">
          {steps.map((step, idx) => (
            <div 
              key={step.id} 
              className={cn(
                "flex flex-col items-center group",
                "cursor-pointer transition-colors",
                idx <= currentStep ? "text-black" : "text-gray-400",
                idx < currentStep && "hover:text-blue-600"
              )}
              onClick={() => {
                // Only allow navigation to completed steps or the current step
                if (idx <= currentStep) {
                  setCurrentStep(idx);
                }
              }}
            >
              <div className="flex items-center">
                <div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                    idx < currentStep ? "bg-green-500 text-white" : (
                      idx === currentStep ? "border-2 border-black bg-white" : "border-2 border-gray-300 bg-white"
                    )
                  )}
                >
                  {idx < currentStep ? <Check className="h-5 w-5" /> : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div 
                    className={cn(
                      "w-24 h-0.5 mx-2 transition-colors",
                      idx < currentStep ? "bg-green-500" : "bg-gray-300"
                    )}
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <div className={cn(
                  "text-sm font-medium",
                  idx === currentStep && "font-semibold"
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 hidden md:block">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Mobile steps view */}
        <div className="flex md:hidden items-center justify-between mb-4 px-2">
          <button 
            className={cn(
              "p-2 rounded-full",
              currentStep > 0 ? "text-black" : "text-gray-300"
            )}
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-center">
            <div className="font-semibold">{steps[currentStep].title}</div>
            <div className="text-xs text-gray-500">Step {currentStep + 1} of {steps.length}</div>
          </div>
          <button 
            className={cn(
              "p-2 rounded-full",
              currentStep < steps.length - 1 ? "text-black" : "text-gray-300"
            )}
            onClick={nextStep}
            disabled={currentStep === steps.length - 1 || !canProceedToNextStep}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      {isLoadingSession ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          <span className="ml-3 text-lg">Loading checkout...</span>
        </div>
      ) : (
        children[currentStep]
      )}
    </div>
  );
}; 
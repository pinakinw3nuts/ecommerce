import React, { useEffect, useState } from 'react';
import { useCheckout } from './CheckoutProvider';
import { Check, CreditCard, MapPin, Package, Truck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

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
    checkoutSession,
    saveCheckoutState,
  } = useCheckout();
  
  // Track if step has been visited for animation purposes
  const [visitedSteps, setVisitedSteps] = useState<Record<number, boolean>>({
    0: true // Always mark first step as visited
  });
  
  // Save state when component unmounts
  useEffect(() => {
    return () => {
      saveCheckoutState();
    };
  }, [saveCheckoutState]);
  
  // Mark steps as visited when user navigates to them
  useEffect(() => {
    setVisitedSteps(prev => ({
      ...prev,
      [currentStep]: true
    }));
  }, [currentStep]);

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
  
  // Handle navigation
  const handleStepClick = (stepIndex: number) => {
    // Only allow navigation to completed steps or the current step
    // Or to the next step if current step is complete
    if (
      stepIndex <= currentStep || 
      (stepIndex === currentStep + 1 && canProceedToNextStep)
    ) {
      setCurrentStep(stepIndex);
    }
  };
  
  // Determine which progress bar segments are completed
  const getProgressBarSegments = () => {
    return Array.from({ length: steps.length - 1 }, (_, i) => {
      // A segment is completed if both steps it connects are completed
      const isCompleted = i < currentStep;
      const isActive = i === currentStep - 1;
      return { isCompleted, isActive };
    });
  };
  
  const progressSegments = getProgressBarSegments();

  return (
    <div className="relative">
      {/* Step progress */}
      <div className="mb-8">
        {/* Desktop stepper */}
        <div className="hidden md:block">
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={cn(
                  "flex flex-col items-center relative",
                  "cursor-pointer transition-all z-10",
                  {
                    "text-black": idx <= currentStep,
                    "text-gray-400": idx > currentStep,
                    "opacity-60 cursor-not-allowed": idx > currentStep + 1 || (idx === currentStep + 1 && !canProceedToNextStep)
                  }
                )}
                onClick={() => handleStepClick(idx)}
                role="button"
                tabIndex={0}
                aria-label={`Go to step ${idx + 1}: ${step.title}`}
              >
                <div 
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                    {
                      "bg-green-500 text-white scale-110": step.isCompleted && idx !== currentStep,
                      "bg-blue-600 text-white scale-110 shadow-md": idx === currentStep,
                      "border-2 border-gray-300 bg-white": !step.isCompleted && idx !== currentStep
                    }
                  )}
                >
                  {step.isCompleted && idx !== currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <>
                      {step.icon}
                      <span className="sr-only">{idx + 1}</span>
                    </>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={cn(
                    "text-sm font-medium",
                    {
                      "font-semibold": idx === currentStep,
                      "text-blue-600": idx === currentStep
                    }
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
          
          {/* Progress bar */}
          <div className="relative mt-5">
            <div className="absolute top-0 left-5 right-5 flex">
              {progressSegments.map((segment, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "h-1 flex-1 mx-px transition-all duration-500",
                    {
                      "bg-green-500": segment.isCompleted,
                      "bg-blue-600": segment.isActive,
                      "bg-gray-200": !segment.isCompleted && !segment.isActive
                    }
                  )}
                  style={{
                    transform: visitedSteps[idx + 1] ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile stepper */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-2 mb-4">
            <Button 
              variant="outline"
              size="sm"
              className={cn(
                "p-2 rounded-md",
                currentStep > 0 ? "text-black" : "text-gray-300"
              )}
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="ml-1">Back</span>
            </Button>
            
            <div className="text-center">
              <div className="font-semibold text-blue-600">{steps[currentStep].title}</div>
              <div className="text-xs text-gray-500">Step {currentStep + 1} of {steps.length}</div>
            </div>
            
            <Button
              variant="outline" 
              size="sm"
              className={cn(
                "p-2 rounded-md",
                canProceedToNextStep && currentStep < steps.length - 1 ? "text-blue-600" : "text-gray-300"
              )}
              onClick={nextStep}
              disabled={currentStep === steps.length - 1 || !canProceedToNextStep}
            >
              <span className="mr-1">Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Button>
          </div>
          
          {/* Mobile progress bar */}
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{ 
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Content */}
      {isLoadingSession ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <span className="text-lg text-gray-700">Loading checkout information...</span>
          <p className="text-sm text-gray-500 mt-2">
            {checkoutSession?.id ? 'Retrieving your saved checkout session...' : 'Creating a new checkout session...'}
          </p>
        </div>
      ) : (
        <div className="transition-all duration-300 ease-in-out">
          {children[currentStep]}
        </div>
      )}
      
      {/* Bottom navigation buttons (for mobile) */}
      <div className="md:hidden mt-6 flex justify-between">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={prevStep}
            className="w-5/12"
          >
            Back
          </Button>
        )}
        
        {currentStep < steps.length - 1 && (
          <Button
            onClick={nextStep}
            disabled={!canProceedToNextStep}
            className={cn(
              "w-5/12",
              currentStep === 0 ? "w-full" : ""
            )}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}; 
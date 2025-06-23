import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Address } from '@/services/checkout';
import type { CartItem, CheckoutSession, OrderPreview } from '@/services/checkout';
import * as checkoutService from '@/services/checkout';
import toast from 'react-hot-toast';

// Keys for localStorage
// export const ORDER_SUBMISSION_KEY = 'order_submission_status';
// export const CHECKOUT_SESSION_KEY = 'checkout_session';
// export const CHECKOUT_FALLBACK_KEY = 'checkout_fallback_data';

// Number of retry attempts for API calls
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // ms

interface CheckoutContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  shippingAddress: Address | null;
  setShippingAddress: (address: Address) => void;
  shippingMethod: string | null;
  setShippingMethod: (method: string) => void;
  paymentMethod: string | null;
  setPaymentMethod: (method: string) => void;
  orderPreview: OrderPreview | null;
  setOrderPreview: (preview: OrderPreview) => void;
  isLoadingOrderPreview: boolean;
  calculateOrderPreview: (userId: string, cartItems: CartItem[], couponCode?: string) => Promise<void>;
  checkoutSession: CheckoutSession | null;
  setCheckoutSession: (session: CheckoutSession) => void;
  isLoadingSession: boolean;
  setIsLoadingSession: (isLoading: boolean) => void;
  createCheckoutSession: (userId: string, cartItems: CartItem[], couponCode?: string) => Promise<CheckoutSession | null>;
  clearCheckout: () => void;
  canProceedToNextStep: boolean;
  isPlacingOrder: boolean;
  setIsPlacingOrder: (isPlacing: boolean) => void;
  saveCheckoutState: () => void;
  restoreCheckoutState: () => boolean;
  updateSessionField: <T>(field: string, value: T) => Promise<boolean>;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// Helper function to retry API calls
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [shippingMethod, setShippingMethod] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [orderPreview, setOrderPreview] = useState<OrderPreview | null>(null);
  const [isLoadingOrderPreview, setIsLoadingOrderPreview] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // Track if we've already attempted to restore from localStorage
  const [hasRestoredState, setHasRestoredState] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasRestoredState) {
      restoreCheckoutState();
      setHasRestoredState(true);
    }
  }, []);

  // Persist currentStep to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('checkout_current_step', String(currentStep));
    }
  }, [currentStep]);

  // Update session in localStorage when it changes (debounced)
  useEffect(() => {
    if (typeof window !== 'undefined' && checkoutSession) {
      const debounceTimer = setTimeout(() => {
        saveCheckoutState();
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [checkoutSession, shippingAddress, shippingMethod, paymentMethod]);

  // Recalculate order preview when shipping method changes
  useEffect(() => {
    if (checkoutSession?.userId && shippingAddress && shippingMethod && checkoutSession?.cartSnapshot) {
      const cartItems = (checkoutSession.cartSnapshot as CartItem[]).map(item => ({
        ...item,
        productId: item.productId || (item as any).id,
      }));
      
      // Use optimistic update for better UX
      const previousPreview = orderPreview;
      
      // Simple optimistic preview update based on shipping method
      if (previousPreview) {
        const optimisticPreview = { ...previousPreview };
        
        // Update shipping cost based on method (basic estimation)
        if (shippingMethod.includes('express')) {
          optimisticPreview.shippingCost = 15.99;
        } else if (shippingMethod.includes('standard')) {
          optimisticPreview.shippingCost = 5.99;
        } else if (shippingMethod.includes('free')) {
          optimisticPreview.shippingCost = 0;
        }
        
        // Recalculate total
        optimisticPreview.total = 
          optimisticPreview.subtotal + 
          optimisticPreview.shippingCost + 
          optimisticPreview.tax - 
          optimisticPreview.discount;
          
        setOrderPreview(optimisticPreview);
      }
      
      // Then fetch the actual data
      calculateOrderPreview(
        checkoutSession.userId,
        cartItems,
        checkoutSession.discountCode
      );
    }
  }, [shippingMethod]);

  const nextStep = useCallback(() => {
    setCurrentStep((s) => {
      const nextStep = s + 1;
      saveCheckoutState();
      return nextStep;
    });
  }, []);
  
  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const calculateOrderPreview = async (userId: string, cartItems: CartItem[], couponCode?: string) => {
    setIsLoadingOrderPreview(true);
    try {
      // Retry operation if it fails
      const previewResponse = await retryOperation(() => 
        checkoutService.calculateOrderPreview(
          userId, 
          cartItems, 
          couponCode, 
          shippingAddress || undefined,
          shippingMethod || undefined
        )
      );
      setOrderPreview(previewResponse.data);
      
      // Cache the preview in case we need it later
      if (typeof window !== 'undefined') {
        try {
          const fallbackData = JSON.parse(localStorage.getItem(checkoutService.CHECKOUT_FALLBACK_KEY) || '{}');
          fallbackData.orderPreview = previewResponse.data;
          localStorage.setItem(checkoutService.CHECKOUT_FALLBACK_KEY, JSON.stringify(fallbackData));
        } catch (e) {
          console.error('Failed to cache order preview:', e);
        }
      }
    } catch (error) {
      console.error('Error calculating order preview:', error);
      
      // Try to load from cache if available
      if (typeof window !== 'undefined') {
        try {
          const fallbackData = JSON.parse(localStorage.getItem(checkoutService.CHECKOUT_FALLBACK_KEY) || '{}');
          if (fallbackData.orderPreview) {
            setOrderPreview(fallbackData.orderPreview);
            toast.error('Using cached order preview. Prices may not be current.');
          } else {
            setOrderPreview(null);
            toast.error('Could not calculate order preview.');
          }
        } catch (e) {
          setOrderPreview(null);
        }
      }
    } finally {
      setIsLoadingOrderPreview(false);
    }
  };

  const createCheckoutSession = async (userId: string, cartItems: CartItem[], couponCode?: string) => {
    setIsLoadingSession(true);
    try {
      const sessionResponse = await retryOperation(() => 
        checkoutService.createCheckoutSession(userId, cartItems, couponCode, shippingAddress || undefined)
      );
      setCheckoutSession(sessionResponse.data);
      
      // Save session ID to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('checkout_session_id', sessionResponse.data.id);
      }
      
      return sessionResponse.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to create checkout session. Please try again.');
      setCheckoutSession(null);
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  };

  const clearCheckout = () => {
    setCurrentStep(0);
    setShippingAddress(null);
    setShippingMethod(null);
    setPaymentMethod(null);
    setOrderPreview(null);
    setCheckoutSession(null);
    setIsPlacingOrder(false);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(checkoutService.ORDER_SUBMISSION_KEY);
      localStorage.removeItem(checkoutService.CHECKOUT_SESSION_KEY);
      localStorage.removeItem(checkoutService.CHECKOUT_FALLBACK_KEY);
      localStorage.removeItem('checkout_session_id');
      localStorage.removeItem('checkout_current_step');
    }
  };

  // Save all checkout state to localStorage
  const saveCheckoutState = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const state = {
          checkoutSession,
          shippingAddress,
          shippingMethod,
          paymentMethod,
          orderPreview,
          currentStep
        };
        localStorage.setItem(checkoutService.CHECKOUT_FALLBACK_KEY, JSON.stringify(state));
        
        if (checkoutSession) {
          localStorage.setItem(checkoutService.CHECKOUT_SESSION_KEY, JSON.stringify(checkoutSession));
        }
      } catch (e) {
        console.error('Failed to save checkout state:', e);
      }
    }
  }, [checkoutSession, shippingAddress, shippingMethod, paymentMethod, orderPreview, currentStep]);

  // Restore checkout state from localStorage
  const restoreCheckoutState = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        // Try to restore checkout session and other data
        const savedSession = localStorage.getItem(checkoutService.CHECKOUT_SESSION_KEY);
        const fallbackData = JSON.parse(localStorage.getItem(checkoutService.CHECKOUT_FALLBACK_KEY) || '{}');
        
        if (savedSession) {
          try {
            const parsedSession = JSON.parse(savedSession);
            setCheckoutSession(parsedSession);
          } catch (e) {
            console.error('Failed to parse saved checkout session:', e);
          }
        }
        
        // Restore other checkout data
        if (fallbackData.shippingAddress) setShippingAddress(fallbackData.shippingAddress);
        if (fallbackData.shippingMethod) setShippingMethod(fallbackData.shippingMethod);
        if (fallbackData.paymentMethod) setPaymentMethod(fallbackData.paymentMethod);
        if (fallbackData.orderPreview) setOrderPreview(fallbackData.orderPreview);
        
        // Restore currentStep from localStorage
        const savedStep = localStorage.getItem('checkout_current_step');
        if (savedStep !== null) {
          setCurrentStep(Number(savedStep));
        }
        
        return true;
      } catch (e) {
        console.error('Failed to restore checkout state:', e);
        return false;
      }
    }
    return false;
  }, []);

  // Update a specific field in the checkout session and sync with backend
  const updateSessionField = async <T,>(field: string, value: T): Promise<boolean> => {
    if (!checkoutSession?.id) {
      console.error('Cannot update session: No active session');
      return false;
    }
    
    try {
      // Optimistic update
      const updatedSession = {
        ...checkoutSession,
        [field]: value
      };
      
      setCheckoutSession(updatedSession);
      
      // Save to localStorage for fallback
      if (typeof window !== 'undefined') {
        localStorage.setItem(checkoutService.CHECKOUT_SESSION_KEY, JSON.stringify({
          ...checkoutSession,
          [field]: value
        }));
      }
      
      // Sync with backend
      await retryOperation(() => 
        checkoutService.updateCheckoutSession(checkoutSession.id, { [field]: value })
      );
      
      return true;
    } catch (error) {
      console.error(`Error updating checkout session field ${field}:`, error);
      toast.error(`Failed to update ${field}. Please try again.`);
      
      // Revert optimistic update if needed
      if (checkoutSession) {
        const originalValue = checkoutSession[field as keyof CheckoutSession];
        setCheckoutSession(prev => prev ? { ...prev, [field]: originalValue } : null);
      }
      
      return false;
    }
  };

  // Derived value for step validation
  const canProceedToNextStep = (() => {
    switch (currentStep) {
      case 0:
        return !!shippingAddress;
      case 1:
        return !!shippingMethod;
      case 2:
        return !!paymentMethod;
      case 3:
        return true;
      default:
        return false;
    }
  })();

  return (
    <CheckoutContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        shippingAddress,
        setShippingAddress,
        shippingMethod,
        setShippingMethod,
        paymentMethod,
        setPaymentMethod,
        orderPreview,
        setOrderPreview,
        isLoadingOrderPreview,
        calculateOrderPreview,
        checkoutSession,
        setCheckoutSession,
        isLoadingSession,
        setIsLoadingSession,
        createCheckoutSession,
        clearCheckout,
        canProceedToNextStep,
        isPlacingOrder,
        setIsPlacingOrder,
        saveCheckoutState,
        restoreCheckoutState,
        updateSessionField,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within a CheckoutProvider');
  return ctx;
}; 
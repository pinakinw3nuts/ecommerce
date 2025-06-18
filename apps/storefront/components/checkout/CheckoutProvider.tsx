import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Address } from '@/services/checkout';
import type { CartItem, CheckoutSession, OrderPreview } from '@/services/checkout';
import * as checkoutService from '@/services/checkout';

// Keys for localStorage
export const ORDER_SUBMISSION_KEY = 'order_submission_status';
export const CHECKOUT_SESSION_KEY = 'checkout_session';

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
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

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

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check order submission status
      const submissionStatus = localStorage.getItem(ORDER_SUBMISSION_KEY);
      setIsPlacingOrder(submissionStatus === 'submitting');
      
      // Try to restore checkout session from localStorage
      const savedSession = localStorage.getItem(CHECKOUT_SESSION_KEY);
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          setCheckoutSession(parsedSession);
        } catch (e) {
          console.error('Failed to parse saved checkout session:', e);
        }
      }
    }
  }, []);

  // Update session in localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && checkoutSession) {
      localStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(checkoutSession));
    }
  }, [checkoutSession]);

  const nextStep = useCallback(() => setCurrentStep((s) => s + 1), []);
  const prevStep = useCallback(() => setCurrentStep((s) => Math.max(0, s - 1)), []);

  const calculateOrderPreview = async (userId: string, cartItems: CartItem[], couponCode?: string) => {
    setIsLoadingOrderPreview(true);
    try {
      const previewResponse = await checkoutService.calculateOrderPreview(userId, cartItems, couponCode, shippingAddress || undefined);
      setOrderPreview(previewResponse.data);
    } catch (error) {
      console.error('Error calculating order preview:', error);
      setOrderPreview(null);
    } finally {
      setIsLoadingOrderPreview(false);
    }
  };

  const createCheckoutSession = async (userId: string, cartItems: CartItem[], couponCode?: string) => {
    setIsLoadingSession(true);
    try {
      const sessionResponse = await checkoutService.createCheckoutSession(userId, cartItems, couponCode, shippingAddress || undefined);
      setCheckoutSession(sessionResponse.data);
      return sessionResponse.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
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
      localStorage.removeItem(ORDER_SUBMISSION_KEY);
      localStorage.removeItem(CHECKOUT_SESSION_KEY);
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
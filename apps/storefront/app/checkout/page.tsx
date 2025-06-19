'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { ShippingAddressForm } from '@/components/checkout/ShippingAddressForm';
import { ShippingMethodForm } from '@/components/checkout/ShippingMethodForm';
import { PaymentOptionForm } from '@/components/checkout/PaymentOptionForm';
import { OrderReviewForm } from '@/components/checkout/OrderReviewForm';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import { CheckoutProvider, useCheckout } from '@/components/checkout/CheckoutProvider';
import * as checkoutService from '@/services/checkout';
import { Button } from '@/components/ui/Button';
import { OrderSummaryCard } from '@/components/checkout/OrderSummaryCard';

// Helper function to validate UUID format
const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items, refreshCart, isCartLoading } = useCart();
  const {
    checkoutSession,
    setCheckoutSession,
    isLoadingSession,
    setIsLoadingSession,
    createCheckoutSession,
    calculateOrderPreview,
    setShippingAddress,
    setShippingMethod,
    setPaymentMethod,
    setCurrentStep,
    clearCheckout,
    orderPreview,
  } = useCheckout();

  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Only run when cart is done loading
    if (isCartLoading) return;
    if (!user?.id) {
      toast.error('Please log in to access checkout.');
      router.push('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty. Add items before checking out.');
      router.push('/cart');
      return;
    }

    let sessionToLoad: checkoutService.CheckoutSession | null = null;

    // Try to load session from URL parameter
    const sessionIdFromUrl = searchParams.get('sessionId');
    if (sessionIdFromUrl && isValidUuid(sessionIdFromUrl)) {
      (async () => {
        try {
          const sessionResponse = await checkoutService.getCheckoutSession(sessionIdFromUrl);
          if (sessionResponse.data.status === 'COMPLETED' || sessionResponse.data.status === 'EXPIRED') {
            toast.error('This checkout session is no longer active.');
            sessionToLoad = null;
          } else {
            sessionToLoad = sessionResponse.data;
          }
        } catch (error) {
          console.error('Error fetching session from URL:', error);
          toast.error('Failed to load checkout session. Starting a new one.');
          sessionToLoad = null;
        }
        continueCheckout(sessionToLoad);
      })();
      return;
    }

    // If no session from URL, try localStorage
    const storedSessionId = localStorage.getItem('checkout_session_id');
    if (storedSessionId && isValidUuid(storedSessionId)) {
      (async () => {
        try {
          const sessionResponse = await checkoutService.getCheckoutSession(storedSessionId);
          if (sessionResponse.data.status === 'COMPLETED' || sessionResponse.data.status === 'EXPIRED') {
            toast.error('Your previous checkout session has expired or completed. Starting a new one.');
            sessionToLoad = null;
            localStorage.removeItem('checkout_session_id');
          } else {
            sessionToLoad = sessionResponse.data;
          }
        } catch (error) {
          console.error('Error fetching session from localStorage:', error);
          toast.error('Failed to load previous checkout session. Starting a new one.');
          sessionToLoad = null;
          localStorage.removeItem('checkout_session_id');
        }
        continueCheckout(sessionToLoad);
      })();
      return;
    }

    // If no valid session, create a new one
    (async () => {
      try {
        const newSession = await createCheckoutSession(
          user.id!,
          items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price, name: item.name }))
        );
        if (newSession) {
          sessionToLoad = newSession;
          localStorage.setItem('checkout_session_id', newSession.id);
          toast.success('New checkout session created.');
        } else {
          throw new Error('Failed to create a new checkout session.');
        }
      } catch (error) {
        console.error('Error creating new session:', error);
        toast.error('Could not start checkout. Please try again.');
        setHasError(true);
        setIsLoadingSession(false);
        return;
      }
      continueCheckout(sessionToLoad);
    })();

    function continueCheckout(sessionToLoad: checkoutService.CheckoutSession | null) {
      if (sessionToLoad) {
        setCheckoutSession(sessionToLoad);
        if (sessionToLoad.shippingAddress) {
          setShippingAddress(sessionToLoad.shippingAddress);
        }
        if (sessionToLoad.shippingMethod) {
          setShippingMethod(sessionToLoad.shippingMethod);
        }
        if (sessionToLoad.paymentMethod) {
          setPaymentMethod(sessionToLoad.paymentMethod);
        }
        // Restore step from localStorage if available, otherwise infer
        const savedStep = localStorage.getItem('checkout_current_step');
        if (savedStep !== null) {
          setCurrentStep(Number(savedStep));
        } else if (sessionToLoad.paymentMethod) {
          setCurrentStep(3);
        } else if (sessionToLoad.shippingMethod) {
          setCurrentStep(2);
        } else if (sessionToLoad.shippingAddress) {
          setCurrentStep(1);
        } else {
          setCurrentStep(0);
        }
        // Recalculate preview only after setting all initial data
        calculateOrderPreview(user?.id as string, items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price, name: item.name })));
      }
      setIsReady(true);
      setIsLoadingSession(false);
    }
  }, [user?.id, items.length, isCartLoading]);

  if (isLoadingSession || !isReady) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          <span className="ml-3 text-lg">Loading checkout...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        <h1 className="text-3xl font-bold mb-6">Checkout Error</h1>
        <p>There was an error loading your checkout. Please try again later.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <Card className="shadow-lg border border-gray-200">
            <CheckoutStepper>
              <ShippingAddressForm />
              <ShippingMethodForm />
              <PaymentOptionForm />
              <OrderReviewForm />
            </CheckoutStepper>
          </Card>
        </div>
        <div className="lg:w-1/3">
          <OrderSummaryCard orderPreview={orderPreview} />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CheckoutProvider>
      <CheckoutPageContent />
    </CheckoutProvider>
  );
} 
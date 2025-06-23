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
    currentStep,
    setCurrentStep,
    orderPreview
  } = useCheckout();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Define continueCheckout before using it
  const continueCheckout = async (sessionToLoad: checkoutService.CheckoutSession | null) => {
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
      calculateOrderPreview(user?.id as string, sessionToLoad.cartSnapshot || items.map(item => mapCartItemToCheckoutItem(item)));
    }
    setIsReady(true);
    setIsLoadingSession(false);
  };

  // Helper function to map cart items to checkout items with all required fields
  const mapCartItemToCheckoutItem = (item: any): checkoutService.CartItem => {
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      imageUrl: item.imageUrl,
      additionalImages: item.additionalImages,
      variant: item.variant,
      variantId: item.variantId,
      variantName: item.variantName,
      description: item.description,
      sku: item.sku,
      inStock: item.inStock,
      brand: item.brand,
      category: item.category,
      attributes: item.attributes,
      dimensions: item.dimensions,
      originalPrice: item.originalPrice,
      salePrice: item.salePrice,
      slug: item.slug,
      metadata: item.metadata
    };
  };

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
          items.map(item => mapCartItemToCheckoutItem(item))
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
      await continueCheckout(sessionToLoad);
    })();

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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>

      <div className="max-w-6xl mx-auto">
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
            <OrderSummaryCard orderPreview={orderPreview} showCouponInput={currentStep !== 3} />
            
            {/* Quick links to help during checkout */}
            <div className="mt-8 bg-white shadow rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium mb-3">Need Help?</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/faq" className="text-blue-600 hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Frequently Asked Questions
                  </a>
                </li>
                <li>
                  <a href="/shipping-policy" className="text-blue-600 hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Shipping Information
                  </a>
                </li>
                <li>
                  <a href="/returns" className="text-blue-600 hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                    Returns & Refunds Policy
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-blue-600 hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Order recovery info */}
            <div className="mt-4 text-sm text-gray-600 p-4 bg-blue-50 rounded-lg">
              <p>Your checkout progress is automatically saved. You can safely return later to complete your order.</p>
            </div>
          </div>
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
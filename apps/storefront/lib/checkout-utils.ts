/**
 * Utility functions for the checkout flow
 */

/**
 * Get the order completion status from localStorage/sessionStorage
 * Returns true if an order was recently completed
 */
export const wasOrderCompleted = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check both localStorage and sessionStorage
  const orderCompletedFlag = localStorage.getItem('order_completed') === 'true';
  const preventCartRedirect = sessionStorage.getItem('prevent_cart_redirect') === 'true';
  
  return orderCompletedFlag || preventCartRedirect;
};

/**
 * Clear checkout-related storage
 * This is used after a checkout is completed to prevent issues with the next checkout
 */
export const clearCheckoutStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear checkout-related data
  localStorage.removeItem('order_completed');
  localStorage.removeItem('checkout_session_id');
  localStorage.removeItem('checkoutData');
  sessionStorage.removeItem('prevent_cart_redirect');
};

/**
 * Mark order as completed in storage
 * This is used to ensure we can properly redirect after order completion
 */
export const markOrderCompleted = (orderId?: string, sessionId?: string): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('order_completed', 'true');
  sessionStorage.setItem('prevent_cart_redirect', 'true');
  
  if (orderId) {
    localStorage.setItem('last_order_id', orderId);
  }
  
  if (sessionId) {
    localStorage.setItem('last_session_id', sessionId);
  }
};

/**
 * Get the URL to redirect to after order completion
 */
export const getOrderCompletionRedirectUrl = (): string => {
  if (typeof window === 'undefined') return '/checkout/success';
  
  const orderId = localStorage.getItem('last_order_id');
  const sessionId = localStorage.getItem('last_session_id') || localStorage.getItem('checkout_session_id');
  
  const url = new URL('/checkout/success', window.location.origin);
  
  if (orderId) {
    url.searchParams.set('orderId', orderId);
  }
  
  if (sessionId) {
    url.searchParams.set('sessionId', sessionId);
  }
  
  return url.toString();
}; 
import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirect to checkout success page after order placement
 * This is a special middleware function that can be called from client-side
 * to ensure proper redirection after order completion
 */
export function redirectToSuccessPage(request: NextRequest) {
  // Check if there's a recent order completion flag
  const hasOrderCompletionFlag = request.cookies.get('order_completed')?.value === 'true';
  
  if (hasOrderCompletionFlag) {
    // Get the URL for success page with query params if available
    const url = new URL('/checkout/success', request.url);
    
    // Try to add orderId and sessionId from cookies if available
    const orderId = request.cookies.get('last_order_id')?.value;
    const sessionId = request.cookies.get('last_session_id')?.value || 
                      request.cookies.get('checkout_session_id')?.value;
    
    if (orderId) {
      url.searchParams.set('orderId', orderId);
    }
    
    if (sessionId) {
      url.searchParams.set('sessionId', sessionId);
    }
    
    // Create response with redirect
    const response = NextResponse.redirect(url);
    
    // Clear the order completion flag
    response.cookies.delete('order_completed');
    
    return response;
  }
  
  // If no completion flag, continue normal flow
  return NextResponse.next();
}

/**
 * Check if an order was recently completed from client-side data
 * Returns true if there's evidence of recent order completion
 */
export function hasRecentOrderCompletion(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check local storage for order completion flag
  const orderCompleted = localStorage.getItem('order_completed') === 'true';
  // Check session storage for redirect prevention flag
  const preventRedirect = sessionStorage.getItem('prevent_cart_redirect') === 'true';
  // Check if there's a last order ID
  const hasOrderId = !!localStorage.getItem('last_order_id');
  
  return orderCompleted || preventRedirect || hasOrderId;
} 
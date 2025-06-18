import { useState, useEffect } from 'react';

// Global storage key for order submission status
const ORDER_SUBMISSION_KEY = 'order_submission_status';

/**
 * Hook to manage order placement state across page refreshes
 * and different checkout components.
 * 
 * This helps prevent multiple order submissions and keeps the 
 * UI state consistent even after page refreshes.
 */
export function useOrderPlacement() {
  const [isPlacingOrder, setIsPlacingOrderState] = useState<boolean>(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem(ORDER_SUBMISSION_KEY);
      setIsPlacingOrderState(savedStatus === 'submitting');
    }
  }, []);

  // Wrapper functions to keep localStorage in sync with state
  const setIsPlacingOrder = (value: boolean) => {
    if (value) {
      localStorage.setItem(ORDER_SUBMISSION_KEY, 'submitting');
    } else {
      localStorage.removeItem(ORDER_SUBMISSION_KEY);
    }
    setIsPlacingOrderState(value);
  };

  const markOrderComplete = (sessionId: string) => {
    localStorage.setItem(ORDER_SUBMISSION_KEY, 'completed');
    localStorage.setItem('last_completed_order_id', sessionId);
    setIsPlacingOrderState(false);
  };

  const resetOrderState = () => {
    localStorage.removeItem(ORDER_SUBMISSION_KEY);
    setIsPlacingOrderState(false);
  };

  return {
    isPlacingOrder,
    setIsPlacingOrder,
    markOrderComplete,
    resetOrderState,
    ORDER_SUBMISSION_KEY
  };
}

export default useOrderPlacement; 
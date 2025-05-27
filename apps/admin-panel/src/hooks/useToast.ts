import { useCallback } from 'react';
import { useToastContext } from '@/components/providers/ToastProvider';

export function useToast() {
  const { showToast } = useToastContext();

  const success = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const error = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const info = useCallback((message: string) => {
    showToast(message, 'info');
  }, [showToast]);

  return {
    success,
    error,
    info,
  };
} 
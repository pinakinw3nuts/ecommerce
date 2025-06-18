import { useToast as useUIToast } from '@/components/ui/Toast';

// Define the interface expected by OrderDetailPage
type ToastProps = {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

// Create a hook that adapts between the different toast APIs
export function useToast() {
  const uiToast = useUIToast();
  
  // Return a compatible API for OrderDetailPage
  return {
    toast: ({ title, description, variant, duration }: ToastProps) => {
      // Map variant to type
      const type = variant === 'destructive' ? 'error' : 'success';
      
      // Call the original toast with adapted parameters
      uiToast.showToast({
        message: title ? `${title}: ${description}` : description,
        type,
        duration
      });
    },
    
    // Also include original API for backward compatibility
    showToast: uiToast.showToast
  };
}

// For direct importing of showToast function
export function showToast(props: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'cart' | 'wishlist';
  duration?: number;
}) {
  const { showToast } = useUIToast();
  return showToast(props);
} 
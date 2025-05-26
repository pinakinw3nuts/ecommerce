import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message);
  },
  error: (message: string) => {
    sonnerToast.error(message);
  },
  default: (options: ToastOptions) => {
    sonnerToast(options.title || 'Notification', {
      description: options.description,
    });
  }
}; 
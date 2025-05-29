interface ToastOptions {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
}

// Define the base toast function
const showToast = (options: ToastOptions) => {
  // Implement toast notification logic here
  // For now, we'll just use console.log
  console.log(`${options.title || 'Toast'}: ${options.description}`);
};

// Export toast object with specialized methods
export const toast = {
  success: (message: string) => {
    showToast({
      title: 'Success',
      description: message,
      variant: 'default'
    });
  },
  error: (message: string) => {
    showToast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    });
  },
  default: (options: ToastOptions) => {
    showToast(options);
  }
}; 
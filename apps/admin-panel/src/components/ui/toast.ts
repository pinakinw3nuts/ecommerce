interface ToastOptions {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export const toast = {
  success: (message: string) => {
    toast({
      title: 'Success',
      description: message,
      variant: 'default'
    });
  },
  error: (message: string) => {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    });
  },
  default: (options: ToastOptions) => {
    // Implement toast notification logic here
    // For now, we'll just use console.log
    console.log(`${options.title || 'Toast'}: ${options.description}`);
  }
}; 
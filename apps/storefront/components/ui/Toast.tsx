'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, ShoppingCart, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'cart' | 'wishlist';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <AlertCircle className="h-5 w-5" />,
    cart: <ShoppingCart className="h-5 w-5" />,
    wishlist: <Heart className="h-5 w-5" />
  };
  
  const bgColors = {
    success: 'bg-green-100 border-green-500 text-green-800',
    error: 'bg-red-100 border-red-500 text-red-800',
    info: 'bg-blue-100 border-blue-500 text-blue-800',
    cart: 'bg-primary/10 border-primary text-primary',
    wishlist: 'bg-pink-100 border-pink-500 text-pink-800'
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 max-w-md py-2 px-4 rounded border-l-4 flex items-center shadow-md',
      bgColors[type]
    )}>
      <div className="mr-2">
        {icons[type]}
      </div>
      <div className="flex-1">
        {message}
      </div>
      <button 
        onClick={handleClose}
        className="ml-2 text-gray-500 hover:text-gray-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ToastContainer component to manage multiple toasts
interface ToastItem extends ToastProps {
  id: string;
}

interface ToastContextType {
  showToast: (props: ToastProps) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// Separate client component for toast portal
function ToastContainer({ toasts, removeToast }: { 
  toasts: ToastItem[], 
  removeToast: (id: string) => void 
}) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  if (!isMounted) return null;
  
  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  const showToast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { ...props, id }]);
  };
  
  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };
  
  const contextValue = { showToast };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 
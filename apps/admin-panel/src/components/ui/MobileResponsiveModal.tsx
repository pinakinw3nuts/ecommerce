'use client';

import { Fragment, ReactNode, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface MobileResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  hideCloseButton?: boolean;
}

export function MobileResponsiveModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  hideCloseButton = false,
}: MobileResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Map maxWidth to Tailwind classes
  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    'full': 'sm:max-w-full sm:w-full'
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-0 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom={isMobile ? "opacity-0 translate-y-full" : "opacity-0 scale-95"}
              enterTo={isMobile ? "opacity-100 translate-y-0" : "opacity-100 scale-100"}
              leave="ease-in duration-200"
              leaveFrom={isMobile ? "opacity-100 translate-y-0" : "opacity-100 scale-100"}
              leaveTo={isMobile ? "opacity-0 translate-y-full" : "opacity-0 scale-95"}
            >
              <Dialog.Panel 
                className={`
                  w-full 
                  ${isMobile ? 'h-screen' : 'sm:rounded-lg'} 
                  ${maxWidthClasses[maxWidth]} 
                  transform overflow-hidden bg-white text-left align-middle shadow-xl transition-all
                `}
              >
                {/* Header */}
                <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      {title}
                    </Dialog.Title>
                    {!hideCloseButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </Button>
                    )}
                  </div>
                  {description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {description}
                    </p>
                  )}
                </div>

                {/* Content */}
                <div className={`
                  px-4 py-4 sm:px-6 
                  ${isMobile ? 'overflow-y-auto' : ''} 
                  ${isMobile && !footer ? 'pb-16' : ''}
                  ${isMobile ? 'max-h-[calc(100vh-120px)]' : 'max-h-[calc(100vh-200px)] overflow-y-auto'}
                `}>
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className={`
                    border-t border-gray-200 px-4 py-3 sm:px-6
                    ${isMobile ? 'bg-white sticky bottom-0' : ''}
                  `}>
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 
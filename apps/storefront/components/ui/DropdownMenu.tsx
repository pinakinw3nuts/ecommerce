'use client';

import React, { Fragment, useRef, useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

export function DropdownMenu({ trigger, children, align = 'right', width = 'w-48' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // Delay before closing to allow moving to menu
  };

  return (
    <div 
      className="relative" 
      ref={dropdownRef} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cursor-pointer">
        {trigger}
      </div>

      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="relative">
          {/* Triangle indicator */}
          <div 
            className={`absolute w-3 h-3 bg-white transform rotate-45 border-t border-l border-gray-200 ${
              align === 'left' ? 'left-4' : 'right-4'
            } top-0 -mt-1.5 z-50`}
            aria-hidden="true"
          />
          
          <div 
            className={`absolute z-40 mt-2 ${width} rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            <div className="py-1">{children}</div>
          </div>
        </div>
      </Transition>
    </div>
  );
}

export function DropdownMenuItem({ 
  children, 
  onClick,
  className = '',
  icon
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${className}`}
      onClick={onClick}
      role="menuitem"
    >
      {icon && <span className="mr-3 text-gray-500">{icon}</span>}
      <span className="font-medium">{children}</span>
    </div>
  );
} 
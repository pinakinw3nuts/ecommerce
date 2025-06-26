'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileCardLayout?: boolean;
}

/**
 * TableWrapper component to ensure proper horizontal scrolling and responsiveness
 * with optional support for stack card layout on mobile devices
 */
export function TableWrapper({ 
  children, 
  className,
  mobileCardLayout = false
}: TableWrapperProps) {
  return (
    <div className={cn(
      "w-full rounded-md border border-gray-200 overflow-hidden",
      className
    )}>
      <div className="overflow-x-auto w-full">
        <div className="inline-block min-w-full align-middle">
          {children}
        </div>
      </div>

      {mobileCardLayout && (
        <div className="md:hidden p-4 border-t">
          <p className="text-sm text-center text-gray-500">
            ← Swipe horizontally to see more columns →
          </p>
        </div>
      )}
    </div>
  );
} 
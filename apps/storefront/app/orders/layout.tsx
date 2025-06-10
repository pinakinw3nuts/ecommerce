'use client';

import { Suspense } from 'react';

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <div className="h-16 w-16 rounded-full bg-gray-100 animate-pulse mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Loading Order Information</h1>
          <p className="text-gray-600">
            Please wait while we load your order details.
          </p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
} 
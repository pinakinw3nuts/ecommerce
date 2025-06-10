'use client';

import { Suspense } from 'react';

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="h-40 flex items-center justify-center">
          <div className="animate-pulse">Loading cart...</div>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
} 
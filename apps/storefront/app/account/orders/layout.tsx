'use client';

import { Suspense } from 'react';

export default function AccountOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">Your Orders</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-16 ml-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 ml-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
} 
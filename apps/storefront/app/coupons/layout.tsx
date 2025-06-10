'use client';

import { Suspense } from 'react';

export default function CouponsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Coupons & Discounts</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="animate-pulse space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-100 h-64 rounded-lg animate-pulse mb-6"></div>
            <div className="bg-gray-100 h-48 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
} 
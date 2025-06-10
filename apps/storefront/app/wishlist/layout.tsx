'use client';

import { Suspense } from 'react';

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
        <div className="flex items-center justify-center py-12">
          <div className="h-16 w-16 rounded-full bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
} 
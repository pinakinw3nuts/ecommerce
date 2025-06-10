'use client';

import Link from 'next/link';
import { Suspense } from 'react';

// Simple component that doesn't use any client hooks requiring Suspense
const NotFoundContent = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-4xl font-bold mb-2">404 – Page Not Found</h1>
    <p className="text-gray-600 mb-6">Sorry, we couldn't find the page you were looking for.</p>
    <Link href="/" className="text-blue-600 underline text-sm">← Go back to homepage</Link>
  </div>
);

// Loading fallback that looks identical to the main content
const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-4xl font-bold mb-2">404 – Page Not Found</h1>
    <p className="text-gray-600 mb-6">Loading...</p>
  </div>
);

export default function NotFound() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotFoundContent />
    </Suspense>
  );
} 
'use client';

import { Suspense } from 'react';
import Link from 'next/link';

// Simple error display component without hooks
const ErrorContent = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-16 bg-white">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        We apologize for the inconvenience. Our team has been notified of this issue.
      </p>
      <div className="space-x-4">
        <button
          onClick={reset}
          className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-md text-sm font-medium transition"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-block border border-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }>
          <ErrorContent error={error} reset={reset} />
        </Suspense>
      </body>
    </html>
  );
} 
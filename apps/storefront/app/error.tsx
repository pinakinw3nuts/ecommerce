'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[APP ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold mb-2 text-red-600">Something went wrong.</h1>
      <p className="text-gray-600 mb-4">An unexpected error occurred. Please try again.</p>
      <button onClick={reset} className="bg-black text-white px-4 py-2 rounded">
        Try Again
      </button>
    </div>
  );
} 
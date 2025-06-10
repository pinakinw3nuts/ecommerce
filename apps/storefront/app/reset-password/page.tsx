'use client';

import { useSearchParams } from 'next/navigation';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Suspense, useEffect, useState } from 'react';

// Loading component
function ResetPasswordLoading() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12 text-center">
      <div className="animate-pulse">Validating reset link...</div>
    </div>
  );
}

// Main content component
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsLoading(false);
        return;
      }

      try {
        // Validate token with the API
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        const data = await response.json();
        
        setIsValidToken(response.ok);
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Validating reset link...</div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="container max-w-md mx-auto px-4 py-12">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Invalid or Expired Link</h1>
          <p className="text-gray-600 mb-6">
            The password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <a
            href="/forgot-password"
            className="inline-block px-4 py-2 bg-[#D23F57] hover:bg-[#b8354a] text-white rounded-md"
          >
            Request New Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}

// Main exported component with Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
} 
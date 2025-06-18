'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string>('');
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get token from query params
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
        {!token ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
              <p>No reset token found. Please use the link from your email.</p>
            </div>
          </div>
        ) : (
          <PasswordResetForm mode="reset" token={token} />
        )}
      </div>
    </div>
  );
} 
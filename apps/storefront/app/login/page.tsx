'use client';

import { useEffect, useState } from 'react';
import { Metadata } from 'next';
import AuthForm from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Login | Shopfinity',
  description: 'Login to your Shopfinity account to access your orders, wishlist, and more.',
};

export default function LoginPage() {
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Get redirect path from URL if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      if (redirect) {
        setRedirectPath(redirect);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
        <AuthForm mode="login" redirectPath={redirectPath} />
      </div>
    </div>
  );
} 
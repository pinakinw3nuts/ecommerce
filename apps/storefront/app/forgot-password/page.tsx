'use client';

import { Metadata } from 'next';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

export const metadata: Metadata = {
  title: 'Forgot Password | Shopfinity',
  description: 'Reset your password for your Shopfinity account.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Forgot Password</h1>
        <PasswordResetForm mode="forgot" />
      </div>
    </div>
  );
} 
'use client';

import { Metadata } from 'next';
import AuthForm from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Sign Up | Shopfinity',
  description: 'Create a new account to start shopping at Shopfinity.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>
        <AuthForm mode="signup" />
      </div>
    </div>
  );
} 
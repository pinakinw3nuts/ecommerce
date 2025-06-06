import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | Shopfinity',
  description: 'Reset your password to regain access to your Shopfinity account.',
};

import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
      <ForgotPasswordForm />
    </div>
  );
} 
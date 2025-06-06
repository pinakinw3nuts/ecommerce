import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Shopfinity',
  description: 'Login to your Shopfinity account to access your orders, wishlist, and more.',
};

import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Login to Your Account</h1>
      <LoginForm />
    </div>
  );
} 
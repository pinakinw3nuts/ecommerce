import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Shopfinity',
  description: 'Create a new account to start shopping at Shopfinity.',
};

import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
      <SignupForm />
    </div>
  );
} 
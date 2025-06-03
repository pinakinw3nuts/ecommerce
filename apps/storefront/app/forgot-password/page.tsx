'use client';

import { useState } from 'react';
import api from '@lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await api.post('/auth/forgot-password', { email });
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-xl font-bold mb-6">Forgot Password</h1>
      {sent ? (
        <p className="text-sm text-green-600">Reset link sent to your email.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="border w-full p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="bg-black text-white px-4 py-2 w-full rounded">Send Reset Link</button>
        </form>
      )}
    </div>
  );
} 
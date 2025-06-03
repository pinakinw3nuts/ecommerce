'use client';

import { useState } from 'react';
import api from '@lib/api';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleReset = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token, password });
      alert('Password updated.');
      router.push('/login');
    } catch {
      alert('Reset failed');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-xl font-bold mb-6">Reset Password</h1>
      <form onSubmit={handleReset} className="space-y-4">
        <input className="border w-full p-2" placeholder="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="bg-black text-white px-4 py-2 w-full rounded">Update Password</button>
      </form>
    </div>
  );
} 
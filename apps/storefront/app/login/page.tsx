'use client';

import { useState } from 'react';
import api from '@lib/api';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      Cookies.set('access_token', data.accessToken);
      router.push('/');
    } catch {
      alert('Login failed');
    }
  };

  const handleGoogle = () => {
    window.location.href = process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/google';
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-xl font-bold mb-6">Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input className="border w-full p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border w-full p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="bg-black text-white px-4 py-2 w-full rounded">Login</button>
      </form>
      <button onClick={handleGoogle} className="text-sm mt-4 text-blue-600 underline block">Login with Google</button>
      <a href="/forgot-password" className="text-sm mt-2 text-gray-600 underline block">Forgot Password?</a>
    </div>
  );
} 
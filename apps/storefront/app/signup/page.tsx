'use client';

import { useState } from 'react';
import api from '@lib/api';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const router = useRouter();

  const handleSignup = async (e: any) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/signup', form);
      Cookies.set('access_token', data.accessToken);
      router.push('/');
    } catch {
      alert('Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-xl font-bold mb-6">Sign Up</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <input className="border w-full p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border w-full p-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border w-full p-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="bg-black text-white px-4 py-2 w-full rounded">Create Account</button>
      </form>
    </div>
  );
} 
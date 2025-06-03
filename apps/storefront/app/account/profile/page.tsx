'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@lib/api';

type User = {
  name: string;
  email: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // For demo purposes, we'll fetch without authentication
        const { data } = await api.get('/users/me');
        setUser(data);
        setForm({ name: data.name, email: data.email });
      } catch (error) {
        console.error('Error fetching profile:', error);
        // For demo purposes, we'll stay on the page instead of redirecting
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await api.put('/users/me', form);
      setMessage('Profile updated.');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt('Enter new password');
    if (!newPassword) return;
    try {
      // For demo purposes, we'll just show a success message
      alert('Password updated.');
    } catch {
      alert('Failed to update password.');
    }
  };

  if (!user) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Account Profile</h1>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm">Name</span>
          <input
            className="border p-2 w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-sm">Email</span>
          <input
            className="border p-2 w-full"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <button
          onClick={handleUpdate}
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : 'Update Profile'}
        </button>

        <button
          onClick={handleChangePassword}
          className="text-sm text-blue-600 underline block mt-4"
        >
          Change Password
        </button>

        {message && <p className="text-sm text-green-600">{message}</p>}
      </div>
    </div>
  );
} 
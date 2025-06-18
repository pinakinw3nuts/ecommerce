'use client';

import ProfileForm from '@/components/profile/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <ProfileForm />
    </div>
  );
} 
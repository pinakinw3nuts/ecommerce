import { Suspense } from 'react';
import UserList from '@/components/users/UserList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users | Admin Panel',
  description: 'User management dashboard',
};

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage user accounts
        </p>
      </div>
      
      <Suspense fallback={<div>Loading users...</div>}>
        <UserList />
      </Suspense>
    </div>
  );
}
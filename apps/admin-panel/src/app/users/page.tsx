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
      <Suspense fallback={<div>Loading users...</div>}>
        <UserList />
      </Suspense>
    </div>
  );
}
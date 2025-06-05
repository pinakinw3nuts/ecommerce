import React from 'react';
import { UserDetailsForm } from './UserDetailsForm';

// Server Component
export default function UserDetailsPage({ params }: { params: { id: string } }) {
  return <UserDetailsForm id={params.id} />;
} 
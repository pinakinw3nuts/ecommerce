import React from 'react';
import { EditBrandClient } from './EditBrandClient';

// Server Component
export default function EditBrandPage({ params }: { params: { id: string } }) {
  return <EditBrandClient id={params.id} />;
} 
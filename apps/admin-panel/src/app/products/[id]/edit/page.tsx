import React from 'react';
import { EditProductClient } from './EditProductClient';

// Server Component
export default function EditProductPage({ params }: { params: { id: string } }) {
  return <EditProductClient id={params.id} />;
} 
import React from 'react';
import { EditCategoryClient } from './EditCategoryClient';

// Server Component
export default function EditCategoryPage({ params }: { params: { id: string } }) {
  return <EditCategoryClient id={params.id} />;
} 
import React from 'react';
import { EditTagClient } from './EditTagClient';

// Server Component
export default function EditTagPage({ params }: { params: { id: string } }) {
  return <EditTagClient id={params.id} />;
} 
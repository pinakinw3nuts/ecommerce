import React from 'react';
import { EditAttributeClient } from './EditAttributeClient';

// Server Component
export default function EditAttributePage({ params }: { params: { id: string } }) {
  return <EditAttributeClient id={params.id} />;
} 
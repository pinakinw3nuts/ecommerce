import React from 'react';
import { EditCouponForm } from './EditCouponForm';

// Main Page Component (Server Component)
export default function EditCouponPage({ params }: { params: { id: string } }) {
  return <EditCouponForm id={params.id} />;
} 
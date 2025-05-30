'use client';

import { Loader2 } from 'lucide-react';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  const { isLoading } = useLoadingState();
  const [mounted, setMounted] = useState(false);
  
  // Only show loading overlay after component has mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || !isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
} 
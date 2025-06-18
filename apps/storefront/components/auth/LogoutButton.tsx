'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  className?: string;
  showIcon?: boolean;
  redirectTo?: string;
}

export default function LogoutButton({
  variant = 'primary',
  className = '',
  showIcon = true,
  redirectTo = '/',
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      
      // Redirect to specified path
      window.location.href = redirectTo;
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Style mapping based on variant
  const variantStyles = {
    primary: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'border border-red-500 text-red-500 hover:bg-red-50',
    text: 'text-red-500 hover:text-red-700 bg-transparent hover:bg-transparent',
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${variantStyles[variant]} ${className}`}
    >
      {showIcon && <LogOut className="w-4 h-4 mr-2" />}
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </Button>
  );
} 
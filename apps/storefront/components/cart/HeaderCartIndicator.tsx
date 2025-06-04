'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function HeaderCartIndicator() {
  const { itemCount } = useCart();
  
  return (
    <Link 
      href="/cart" 
      className="text-neutral-700 hover:text-neutral-900 relative flex items-center"
      aria-label="View your shopping cart"
    >
      <ShoppingBag size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
} 
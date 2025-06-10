'use client';

import Link from 'next/link';
import { ReactNode, Suspense } from 'react';
import AuthGuard from '@/components/layout/AuthGuard';

// Simple loading component for the suspense fallback
function AccountLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-24 bg-gray-100 rounded"></div>
        <div className="h-12 bg-gray-100 rounded"></div>
        <div className="h-12 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}

// Client component that provides the layout structure
function AccountLayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-64 shrink-0">
          <nav className="space-y-1">
            <Link 
              href="/account" 
              className="block p-2 hover:bg-gray-100 rounded"
            >
              Dashboard
            </Link>
            <Link 
              href="/account/profile" 
              className="block p-2 hover:bg-gray-100 rounded"
            >
              Profile
            </Link>
            <Link 
              href="/account/orders" 
              className="block p-2 hover:bg-gray-100 rounded"
            >
              Orders
            </Link>
            <Link 
              href="/account/addresses" 
              className="block p-2 hover:bg-gray-100 rounded"
            >
              Addresses
            </Link>
            <Link 
              href="/account/wishlist" 
              className="block p-2 hover:bg-gray-100 rounded"
            >
              Wishlist
            </Link>
          </nav>
        </aside>
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Suspense fallback={<AccountLoading />}>
        <AccountLayoutContent>
          {children}
        </AccountLayoutContent>
      </Suspense>
    </AuthGuard>
  );
} 
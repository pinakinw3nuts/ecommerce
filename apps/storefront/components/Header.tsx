'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header style={{ 
      width: '100%', 
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--background-color)'
    }}>
      <div style={{
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: 'var(--spacing-4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link href="/" style={{ 
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: 'var(--text-color)'
        }}>
          🛒 MyStore
        </Link>
        <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
          <Link href="/products" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Products</Link>
          <Link href="/cart" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Cart</Link>
          <Link href="/account" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Account</Link>
        </nav>
      </div>
    </header>
  );
} 
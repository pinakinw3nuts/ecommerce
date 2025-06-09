import '../styles/globals.css';
import Header from '@components/layout/Header';
import SiteFooter from '@components/layout/SiteFooter';
import type { Metadata } from 'next';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import AuthDebug from '@/components/layout/AuthDebug';

export const metadata: Metadata = {
  title: 'AutoParts – Premium Auto Parts Store',
  description: 'Your trusted source for OEM and aftermarket auto parts for European vehicles.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body 
        suppressHydrationWarning
        className="min-h-screen bg-gray-50 text-gray-900"
      >
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Header />
                <main className="min-h-[calc(100vh-160px)]">{children}</main>
                <SiteFooter />
                <AuthDebug />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

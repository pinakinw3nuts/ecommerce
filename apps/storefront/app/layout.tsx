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
  title: 'Shopfinity – Modern Fashion Store',
  description: 'Your go-to destination for curated fashion and accessories.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body 
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground"
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

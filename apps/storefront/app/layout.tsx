import '../styles/globals.css';
import Header from '@components/Header';
import Footer from '@components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MyStore – Buy Anything',
  description: 'The best place to buy anything online.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body 
        suppressHydrationWarning
        style={{ 
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
          margin: 0,
          padding: 0
        }}
      >
        <Header />
        <main style={{ minHeight: 'calc(100vh - 160px)' }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

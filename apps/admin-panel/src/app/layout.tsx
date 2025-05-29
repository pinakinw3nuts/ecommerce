import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { LoadingProvider } from '@/hooks/useLoadingState';
import LoadingOverlay from '@/components/LoadingOverlay';

const inter = Inter({ subsets: ['latin'] });

// Function to check if the current path is the login page
function isLoginPage(pathname: string): boolean {
  return pathname === '/login';
}

// Function to check if the current path is a public path
function isPublicPath(pathname: string): boolean {
  return ['/login', '/forgot-password', '/reset-password'].includes(pathname);
}

// Auth check middleware
async function authCheck(pathname: string) {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token');
  
  // If we're on a public path, no need to check auth
  if (isPublicPath(pathname)) {
    return false;
  }
  
  const isAuthenticated = !!token;

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicPath(pathname)) {
    redirect('/login');
  }

  return isAuthenticated;
}

export const metadata = {
  title: "Admin Panel",
  description: "E-commerce Admin Panel",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current pathname from the request
  const pathname = new URL(cookies().get('next-url')?.value || '/', 'http://localhost').pathname;
  
  // If it's a public path, return the minimal layout
  if (isPublicPath(pathname)) {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-gray-50`}>
          <div className="min-h-screen flex items-center justify-center">
            <ToastProvider>
              {children}
            </ToastProvider>
          </div>
        </body>
      </html>
    );
  }
  
  // For all other paths, check authentication
  const isAuthenticated = await authCheck(pathname);
  
  if (!isAuthenticated) {
    redirect('/login');
  }

  // Return the full layout with sidebar and header for authenticated pages
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <ToastProvider>
          <LoadingProvider>
            <div className="flex min-h-screen bg-gray-50">
              {/* Sidebar */}
              <div className="fixed inset-y-0 z-50 flex w-64 flex-col">
                <Sidebar />
              </div>

              {/* Main content */}
              <div className="pl-64 flex flex-col flex-1">
                {/* Header */}
                <Header />

                {/* Page content */}
                <main className="flex-1 p-6">
                  {children}
                </main>
              </div>
            </div>
            <LoadingOverlay />
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

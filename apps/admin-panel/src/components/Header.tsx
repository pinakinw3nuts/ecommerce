'use client';

import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import { UserCircle, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Map to convert path segments to readable page titles
const pageTitles: Record<string, string> = {
  '': 'Dashboard',
  'users': 'Users',
  'products': 'Products',
  'inventory': 'Inventory',
  'orders': 'Orders',
  'payments': 'Payments',
  'offers': 'Promotional Offers',
  'analytics': 'Analytics',
  'settings': 'Settings',
};

// Handle nested paths
const getPageTitle = (pathname: string): string => {
  // Remove leading slash and split by '/'
  const segments = pathname.replace(/^\/+/, '').split('/');
  
  // If it's the root path, return Dashboard
  if (segments[0] === '') return 'Dashboard';
  
  // For nested paths, we'll show the most specific title
  // Check if we have a specific title for this path
  if (segments.length > 1) {
    // For product subcategories
    if (segments[0] === 'products' && segments.length === 2) {
      const subpage = segments[1];
      switch (subpage) {
        case 'categories': return 'Product Categories';
        case 'attributes': return 'Product Attributes';
        case 'brands': return 'Product Brands';
        case 'tags': return 'Product Tags';
        default: return 'Products';
      }
    }
    
    // For other nested paths, try to get the title of the last segment
    const lastSegment = segments[segments.length - 1];
    if (pageTitles[lastSegment]) {
      return pageTitles[lastSegment];
    }
  }
  
  // Otherwise, return the title for the first segment or capitalize it if not found
  return pageTitles[segments[0]] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
};

export default function Header() {
  const pathname = usePathname();
  const { logout } = useAuth();
  // Initialize with the correct page title based on the current pathname
  const [pageTitle, setPageTitle] = useState(() => getPageTitle(pathname));

  // Update page title when pathname changes
  useEffect(() => {
    setPageTitle(getPageTitle(pathname));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      // First clear auth state
      logout();
      
      // Then make the API call
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Silently fail if the endpoint doesn't exist yet
      });

      // Finally, force a hard navigation to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still attempt to force navigation on error
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Page title */}
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 rounded-full bg-white p-1.5 text-gray-700 hover:text-gray-900">
              <UserCircle className="h-8 w-8" />
              <span className="hidden text-sm font-medium sm:block">Admin User</span>
              <ChevronDown className="h-4 w-4" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => window.location.href = '/settings'}
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
} 
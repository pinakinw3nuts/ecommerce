'use client';

import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import { UserCircle, LogOut, Settings, ChevronDown, Bell } from 'lucide-react';
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
  const [isMobileView, setIsMobileView] = useState(false);
  // Initialize with the correct page title based on the current pathname
  const [pageTitle, setPageTitle] = useState(() => getPageTitle(pathname));

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side - Page title */}
        <div className="flex items-center">
          {/* Space for mobile menu button */}
          <div className="md:hidden w-8"></div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications - hidden on smallest screens */}
          <button className="hidden sm:flex p-1.5 rounded-full hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>
          
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-1 md:gap-2 rounded-full bg-white p-1.5 text-gray-700 hover:text-gray-900">
              <UserCircle className="h-6 w-6 md:h-8 md:w-8" />
              <span className="hidden md:block text-sm font-medium">Admin User</span>
              <ChevronDown className="hidden md:block h-4 w-4" />
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
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
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
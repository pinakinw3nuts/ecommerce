'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoadingState } from '@/hooks/useLoadingState';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Ticket,
  PackageSearch,
  Tags,
  BookmarkIcon,
  ChevronDown,
  ChevronRight,
  Tag,
  Sliders,
  Loader2,
  Truck,
  Star,
  Gift
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  submenu?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  {
    name: 'Product Management',
    href: '/products',
    icon: Package,
    submenu: [
      { name: 'All Products', href: '/products', icon: Package },
      { name: 'Categories', href: '/products/categories', icon: BookmarkIcon },
      { name: 'Attributes', href: '/products/attributes', icon: Sliders },
      { name: 'Brands', href: '/products/brands', icon: Tags },
      { name: 'Tags', href: '/products/tags', icon: Tag },
    ],
  },
  { name: 'Inventory', href: '/inventory', icon: PackageSearch },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Offers', href: '/offers', icon: Ticket },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  {
    name: 'Shipping Management',
    href: '/shipping',
    icon: Truck,
    submenu: [
      { name: 'Shipping Methods', href: '/shipping/methods', icon: Truck },
      { name: 'Shipping Zones', href: '/shipping/zones', icon: BookmarkIcon },
      { name: 'Shipping Rates', href: '/shipping/rates', icon: Sliders },
    ],
  },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { setLoading } = useLoadingState();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Product Management']);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

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

  const handleNavigation = (href: string, itemName: string) => {
    // Don't navigate if we're already on this page
    if (pathname === href) return;
    
    // Set loading state
    setActiveItem(itemName);
    setLoading(true);
    
    // Use direct navigation for faster page loads
    window.location.href = href;
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = pathname === item.href;
    const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
    const isExpanded = expandedMenus.includes(item.name);
    const isLoading = activeItem === item.name;

    const MenuContent = () => (
      <div className="flex items-center">
        {isLoading ? (
          <Loader2 className="mr-3 h-5 w-5 flex-shrink-0 animate-spin text-blue-600" />
        ) : (
          <item.icon
            className={`mr-3 h-5 w-5 flex-shrink-0 ${
              isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
            }`}
            aria-hidden="true"
          />
        )}
        {item.name}
      </div>
    );

    return (
      <div key={item.name}>
        {hasSubmenu ? (
          <div
            className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
            onClick={() => toggleSubmenu(item.name)}
          >
            <MenuContent />
            <div className="ml-auto">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => handleNavigation(item.href, item.name)}
            className={`group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`}
            disabled={isLoading}
          >
            <MenuContent />
          </button>
        )}
        
        {hasSubmenu && isExpanded && item.submenu && (
          <div className="ml-6 mt-1 space-y-1">
            {item.submenu.map((subItem) => (
              <button
                key={subItem.name}
                onClick={() => handleNavigation(subItem.href, subItem.name)}
                className={`group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === subItem.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
                disabled={isLoading && activeItem === subItem.name}
              >
                {isLoading && activeItem === subItem.name ? (
                  <Loader2 className="mr-3 h-4 w-4 flex-shrink-0 animate-spin text-blue-600" />
                ) : (
                  <subItem.icon
                    className={`mr-3 h-4 w-4 flex-shrink-0 ${
                      pathname === subItem.href
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-blue-600'
                    }`}
                    aria-hidden="true"
                  />
                )}
                {subItem.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-white border-r">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-blue-600" />
          <span className="text-xl font-semibold">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map(renderNavigationItem)}
      </nav>

      {/* Logout button */}
      <div className="border-t p-4">
        <button
          type="button"
          className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOut
            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600"
            aria-hidden="true"
          />
          Logout
        </button>
      </div>
    </div>
  );
} 
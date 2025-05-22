'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  PackageSearch
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: PackageSearch },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Offers', href: '/offers', icon: Ticket },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

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
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="border-t p-4">
        <button
          type="button"
          className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600"
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
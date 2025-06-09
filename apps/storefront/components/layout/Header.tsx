'use client';

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CartIcon, HeartIcon, SearchIcon, MenuIcon, UserIcon } from '../icons';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu';

// Define the Category type
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  count?: number;
}

// Icons for dropdown menu
const UserAccountIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const OrdersIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

const AddressIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ProfileIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Add a chevron down icon
const ChevronDownIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount: cartItemCount } = useCart();
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories?limit=50');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
          console.log('Fetched categories:', data.categories);
        } else {
          console.log('No categories found in API response');
          setCategories([]);
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Generate category URL from slug
  const getCategoryUrl = (slug: string) => `/products?category=${encodeURIComponent(slug)}`;

  return (
    <header className="w-full">
      {/* Top red bar */}
      <div className="bg-red-600 h-1 w-full"></div>
      
      {/* Main header */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center">
            <div className="font-bold text-2xl">
              <span className="text-red-600">A2Z</span>
              <span className="text-sm block">NEW GENERATION PARTS SUPPLIER</span>
            </div>
          </div>
        </Link>
        
        {/* Search */}
        <div className="flex-grow max-w-3xl mx-6">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search the store"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none"
            />
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-r-md hover:bg-red-700"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
        
        {/* User/Wishlist/Cart */}
        <div className="flex items-center space-x-6">
          {isAuthenticated && user ? (
            <DropdownMenu
              trigger={
                <div className="flex items-center space-x-1 hover:text-red-600 transition-colors group">
                  <div className="flex flex-col items-center">
                    <UserIcon className="h-6 w-6 text-gray-700 group-hover:text-red-600" />
                    <div className="text-xs mt-1">
                      <span>Hello,</span>
                      <span className="block font-medium truncate max-w-[60px]">{user.name || 'User'}</span>
                    </div>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 mt-3 text-gray-500 group-hover:text-red-600 transition-colors" />
                </div>
              }
              width="w-56"
            >
              <DropdownMenuItem
                icon={<UserAccountIcon />}
              >
                <Link href="/account" className="w-full block">
                  My Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                icon={<OrdersIcon />}
              >
                <Link href="/account/orders" className="w-full block">
                  Orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                icon={<AddressIcon />}
              >
                <Link href="/account/addresses" className="w-full block">
                  Addresses
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                icon={<ProfileIcon />}
              >
                <Link href="/account/profile" className="w-full block">
                  Profile
                </Link>
              </DropdownMenuItem>
              <div className="border-t border-gray-100 my-1"></div>
              <DropdownMenuItem
                onClick={handleLogout}
                icon={<LogoutIcon />}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <div className="flex flex-col items-center hover:text-red-600 transition-colors group">
                <UserIcon className="h-6 w-6 text-gray-700 group-hover:text-red-600 transition-colors" />
                <div className="text-xs mt-1">
                  <span>Hello</span>
                  <span className="block font-medium">Sign In</span>
                </div>
              </div>
            </Link>
          )}
          
          <Link href="/wishlist">
            <div className="flex flex-col items-center">
              <HeartIcon className="h-6 w-6 text-gray-700" />
              <div className="text-xs mt-1">
                <span>Wish</span>
                <span className="block">Lists</span>
              </div>
            </div>
          </Link>
          
          <Link href="/cart" className="flex flex-col items-center">
            <div className="relative">
              <CartIcon className="h-6 w-6 text-gray-700" />
              {cartItemCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </div>
              )}
            </div>
            <div className="text-xs mt-1">
              <span>Cart</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Category navigation */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <div className="relative">
              <button 
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              >
                <MenuIcon className="h-5 w-5" />
                <span>Category</span>
              </button>
              
              {showCategoryMenu && (
                <div className="absolute left-0 top-full w-64 bg-white border border-gray-200 shadow-lg z-10">
                  {loading ? (
                    <div className="p-4 text-center">Loading categories...</div>
                  ) : error ? (
                    <div className="p-4 text-center text-red-500">{error}</div>
                  ) : (
                    <ul>
                      {categories.map((category) => (
                        <li key={category.id}>
                          <Link 
                            href={getCategoryUrl(category.slug)}
                            className="block px-4 py-2 hover:bg-gray-100"
                            onClick={() => setShowCategoryMenu(false)}
                          >
                            {category.name}
                            {category.count !== undefined && (
                              <span className="ml-2 text-gray-500 text-xs">({category.count})</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            
            <nav className="flex-grow overflow-x-auto">
              <ul className="flex space-x-6 px-4">
                {loading ? (
                  <li className="py-3 text-sm text-gray-500">Loading categories...</li>
                ) : error ? (
                  <li className="py-3 text-sm text-red-500">{error}</li>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <li key={category.id} className="whitespace-nowrap">
                      <Link 
                        href={getCategoryUrl(category.slug)}
                        className="block py-3 text-sm hover:text-red-600"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="py-3 text-sm text-gray-500">No categories found</li>
                )}
              </ul>
            </nav>
            
            {/* Social Icons */}
            <div className="flex items-center space-x-4 ml-auto">
              <Link href="#" className="text-gray-700 hover:text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-700 hover:text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-700 hover:text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 
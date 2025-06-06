'use client';

import Link from 'next/link';
import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  CartIcon,
  HeartIcon,
  SearchIcon,
  MenuIcon,
  ChevronDownIcon,
  UserIcon,
  LogOutIcon
} from '../icons';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';

// Define the categories to match sidebar categories
const searchCategories = [
  { id: 'all', name: 'All Categories' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'home', name: 'Home & Kitchen' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'beauty', name: 'Beauty' },
];

// Add this constant near the top of the file
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000/api';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const { itemCount: cartItemCount } = useCart();
  const { itemCount: wishlistItemCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract category and search from URL on initial load and when URL changes
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (searchParam) {
      setSearchQuery(searchParam);
      console.log(`Header: Setting search query from URL: "${searchParam}"`);
    }
    
    if (categoryParam) {
      const matchedCategory = searchCategories.find(
        cat => cat.id.toLowerCase() === categoryParam.toLowerCase()
      );
      if (matchedCategory) {
        setSearchCategory(matchedCategory.id);
        console.log(`Header: Setting category from URL: "${matchedCategory.id}"`);
      }
    }
  }, [searchParams]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    
    try {
      // Get the category ID to use in the URL
      const categoryId = searchCategory === 'all' ? '' : searchCategory;
      
      // Create new URLSearchParams object
      const params = new URLSearchParams();
      
      // If we have a search query, add it to the URL
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      
      // Add category if selected
      if (categoryId) {
        params.set('category', categoryId);
      }
      
      // Reset to page 1 when searching
      params.set('page', '1');
      
      // Log the search attempt
      console.log('Header Search:', {
        query: searchQuery.trim() || '(no query)',
        category: categoryId || 'all',
        fullParams: params.toString(),
        url: `/products?${params.toString()}`
      });
      
      // Check if we have any parameters, otherwise go to base products page
      const queryString = params.toString();
      const url = queryString ? `/products?${queryString}` : '/products';
      
      // Navigate to products page with search parameters
      // Use window.location for a full page refresh to ensure proper state reset
      window.location.href = url;
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Handle direct category selection from dropdown (without search)
  const handleCategoryChange = (newCategory: string) => {
    setSearchCategory(newCategory);
    
    // If no search query, apply the category filter immediately
    if (!searchQuery.trim()) {
      // Create new URLSearchParams object
      const params = new URLSearchParams();
      
      // Add category if not "all"
      if (newCategory !== 'all') {
        params.set('category', newCategory);
      }
      
      // Reset to page 1
      params.set('page', '1');
      
      // Log the category selection
      console.log('Header Category Selection:', {
        category: newCategory,
        fullParams: params.toString(),
        url: `/products?${params.toString()}`
      });
      
      // Check if we have any parameters, otherwise go to base products page
      const queryString = params.toString();
      const url = queryString ? `/products?${queryString}` : '/products';
      
      // Navigate to products page with the category parameter
      window.location.href = url;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderUserSection = () => {
    if (isAuthenticated) {
      return (
        <div className="relative" ref={userMenuRef}>
          <button
            className="flex items-center space-x-1"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              {user?.name?.charAt(0) || <UserIcon className="h-5 w-5" />}
            </div>
            <span className="hidden md:inline text-sm">
              {user?.name || 'Account'}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link
                href="/account"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setUserMenuOpen(false)}
              >
                My Account
              </Link>
              <Link
                href="/orders"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setUserMenuOpen(false)}
              >
                My Orders
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setUserMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Logout
                </div>
              </button>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-[#D23F57] hover:bg-[#b8354a] text-white" size="sm">
              Sign Up
            </Button>
          </Link>
        </div>
      );
    }
  };

  return (
    <header className="w-full">
      {/* Top Bar */}
      <div className="bg-[#D23F57] text-white">
        <div className="container mx-auto px-4 flex justify-between items-center h-10">
          <div className="flex items-center space-x-3">
            <span className="bg-white text-[#D23F57] text-xs font-bold px-2 py-0.5 rounded">
              HOT
            </span>
            <span className="text-sm">Free Express Shipping</span>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <button className="text-sm flex items-center gap-1 mr-4">
                <span>EN</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Twitter" className="text-white">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.599-.1-.899a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="text-white">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="text-white">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M11.999 7.377a4.623 4.623 0 1 0 0 9.248 4.623 4.623 0 0 0 0-9.248zm0 7.627a3.004 3.004 0 1 1 0-6.008 3.004 3.004 0 0 1 0 6.008z"></path>
                  <circle cx="16.806" cy="7.207" r="1.078"></circle>
                  <path d="M20.533 6.111A4.605 4.605 0 0 0 17.9 3.479a6.606 6.606 0 0 0-2.186-.42c-.963-.042-1.268-.054-3.71-.054s-2.755 0-3.71.054a6.554 6.554 0 0 0-2.184.42 4.6 4.6 0 0 0-2.633 2.632 6.585 6.585 0 0 0-.419 2.186c-.043.962-.056 1.267-.056 3.71 0 2.442 0 2.753.056 3.71.015.748.156 1.486.419 2.187a4.61 4.61 0 0 0 2.634 2.632 6.584 6.584 0 0 0 2.185.45c.963.042 1.268.055 3.71.055s2.755 0 3.71-.055a6.615 6.615 0 0 0 2.186-.419 4.613 4.613 0 0 0 2.633-2.633c.263-.7.404-1.438.419-2.186.043-.962.056-1.267.056-3.71s0-2.753-.056-3.71a6.581 6.581 0 0 0-.421-2.217zm-1.218 9.532a5.043 5.043 0 0 1-.311 1.688 2.987 2.987 0 0 1-1.712 1.711 4.985 4.985 0 0 1-1.67.311c-.95.044-1.218.055-3.654.055-2.438 0-2.687 0-3.655-.055a4.96 4.96 0 0 1-1.669-.311 2.985 2.985 0 0 1-1.719-1.711 5.08 5.08 0 0 1-.311-1.669c-.043-.95-.053-1.218-.053-3.654 0-2.437 0-2.686.053-3.655a5.038 5.038 0 0 1 .311-1.687c.305-.789.93-1.41 1.719-1.712a5.01 5.01 0 0 1 1.669-.311c.951-.043 1.218-.055 3.655-.055s2.687 0 3.654.055a4.96 4.96 0 0 1 1.67.311 2.991 2.991 0 0 1 1.712 1.712 5.08 5.08 0 0 1 .311 1.669c.043.951.054 1.218.054 3.655 0 2.436 0 2.698-.043 3.654h-.011z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center">
                <div className="bg-[#D23F57] text-white font-bold text-xl w-10 h-10 rounded-md flex items-center justify-center mr-2">S</div>
                <span className="font-bold text-xl">Shopfinity</span>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-8">
              <div className="relative flex flex-1">
                <div className="flex items-center">
                  <div className="relative">
                    <select
                      value={searchCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="h-10 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 pl-3 pr-8 text-sm focus:border-[#D23F57] focus:outline-none"
                    >
                      {searchCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="flex-1 h-10 border border-gray-300 px-4 focus:outline-none focus:border-[#D23F57]"
                />
                <button
                  type="submit"
                  className="h-10 bg-[#D23F57] text-white px-4 rounded-r-md hover:bg-[#b8354a]"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center space-x-4">
              {/* User Section */}
              {renderUserSection()}

              {/* Wishlist Icon */}
              <Link href="/wishlist" className="relative p-2">
                <HeartIcon className="h-6 w-6" />
                {wishlistItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-[#D23F57] text-white border-2 border-white text-xs">
                    {wishlistItemCount}
                  </Badge>
                )}
              </Link>

              {/* Cart Icon */}
              <Link href="/cart" className="relative p-2">
                <CartIcon className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-[#D23F57] text-white border-2 border-white text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <ul className="flex items-center space-x-8 h-12 text-sm">
            <li>
              <Link href="/" className={`font-medium ${pathname === '/' ? 'text-[#D23F57]' : 'hover:text-[#D23F57]'}`}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" className={`font-medium ${pathname === '/products' ? 'text-[#D23F57]' : 'hover:text-[#D23F57]'}`}>
                Shop
              </Link>
            </li>
            <li>
              <Link href="/products?category=clothing" className={`font-medium ${pathname.includes('/products') && searchParams.get('category') === 'clothing' ? 'text-[#D23F57]' : 'hover:text-[#D23F57]'}`}>
                Clothing
              </Link>
            </li>
            <li>
              <Link href="/products?category=electronics" className={`font-medium ${pathname.includes('/products') && searchParams.get('category') === 'electronics' ? 'text-[#D23F57]' : 'hover:text-[#D23F57]'}`}>
                Electronics
              </Link>
            </li>
            <li>
              <Link href="/products?category=home" className={`font-medium ${pathname.includes('/products') && searchParams.get('category') === 'home' ? 'text-[#D23F57]' : 'hover:text-[#D23F57]'}`}>
                Home & Kitchen
              </Link>
            </li>
            <li>
              <Link href="/products?category=beauty" className={`font-medium ${pathname.includes('/products') && searchParams.get('category') === 'beauty' ? 'text-[#D23F57]' : 'hover:text-[#D23F57]'}`}>
                Beauty
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Search and Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="flex-1 h-10 border border-gray-300 rounded-l-md px-4 focus:outline-none focus:border-[#D23F57]"
              />
              <button
                type="submit"
                className="h-10 bg-[#D23F57] text-white px-4 rounded-r-md hover:bg-[#b8354a]"
              >
                <SearchIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
          
          <div className="space-y-3">
            <Link href="/" className="block py-2 hover:text-[#D23F57]">
              Home
            </Link>
            <Link href="/products" className="block py-2 hover:text-[#D23F57]">
              Shop All
            </Link>
            <Link href="/products?category=clothing" className="block py-2 hover:text-[#D23F57]">
              Clothing
            </Link>
            <Link href="/products?category=electronics" className="block py-2 hover:text-[#D23F57]">
              Electronics
            </Link>
            <Link href="/products?category=home" className="block py-2 hover:text-[#D23F57]">
              Home & Kitchen
            </Link>
            <Link href="/products?category=beauty" className="block py-2 hover:text-[#D23F57]">
              Beauty
            </Link>
            <Link href="/wishlist" className="block py-2 hover:text-[#D23F57]">
              Wishlist
            </Link>
            <Link href="/cart" className="block py-2 hover:text-[#D23F57]">
              Cart
            </Link>
          </div>
        </div>
      )}
    </header>
  );
} 
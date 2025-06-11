'use client';

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CartIcon, HeartIcon, SearchIcon, MenuIcon, UserIcon, ShoppingBagIcon } from '../icons';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu';
import { HomeIcon } from 'lucide-react';

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
  const { itemCount: wishlistItemCount } = useWishlist();
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  
  // Fetch categories from API with retry
  useEffect(() => {
    const fetchCategories = async (retryCount = 0) => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories?limit=50', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
          console.log('Successfully fetched categories');
        } else {
          console.log('No categories found in API response');
          setCategories([]);
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching categories:', error);
        
        // Try again if we haven't exhausted retries
        if (retryCount < 2) {
          console.log(`Retrying category fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => {
            fetchCategories(retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        // If all retries failed, use fallback categories
        setError('Failed to load categories');
        setCategories([
          { id: 'electronics', name: 'Electronics', slug: 'electronics', description: '', image: '', count: 0 },
          { id: 'clothing', name: 'Clothing', slug: 'clothing', description: '', image: '', count: 0 },
          { id: 'home-kitchen', name: 'Home & Kitchen', slug: 'home-kitchen', description: '', image: '', count: 0 },
          { id: 'beauty', name: 'Beauty', slug: 'beauty', description: '', image: '', count: 0 },
          { id: 'books', name: 'Books', slug: 'books', description: '', image: '', count: 0 }
        ]);
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
            <div className="flex flex-col items-center hover:text-red-600 transition-colors group">
              <div className="relative">
                <HeartIcon className="h-6 w-6 text-gray-700 group-hover:text-red-600 transition-colors" />
                {wishlistItemCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistItemCount}
                  </div>
                )}
              </div>
              <div className="text-xs mt-1">
                <span>Wish</span>
                <span className="block">Lists</span>
              </div>
            </div>
          </Link>
          
          <Link href="/cart" className="flex flex-col items-center hover:text-red-600 transition-colors group">
            <div className="relative">
              <CartIcon className="h-6 w-6 text-gray-700 group-hover:text-red-600 transition-colors" />
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
      
      {/* Enhanced Product Menu */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <div className="relative group">
              <button 
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 transition-all hover:bg-red-700"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                aria-expanded={showCategoryMenu}
                aria-controls="category-menu"
              >
                <MenuIcon className="h-5 w-5" />
                <span>All Categories</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                id="category-menu"
                className={`absolute left-0 top-full w-72 bg-white border border-gray-200 shadow-lg z-20 transition-opacity duration-200 ${
                  showCategoryMenu ? 'opacity-100' : 'opacity-0 invisible'
                }`}
              >
                {loading ? (
                  <div className="p-6 text-center flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading categories...</span>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-red-500 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                ) : (
                  <ul className="py-1 max-h-96 overflow-y-auto">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link 
                          href={getCategoryUrl(category.slug)}
                          className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors group"
                          onClick={() => setShowCategoryMenu(false)}
                        >
                          {category.image && (
                            <div className="w-8 h-8 flex-shrink-0 mr-3">
                              <Image 
                                src={category.image} 
                                alt={category.name || 'Category image'}
                                width={32}
                                height={32}
                                className="object-contain"
                              />
                            </div>
                          )}
                          <div className="flex-grow">
                            <span className="font-medium group-hover:text-red-600 transition-colors">{category.name}</span>
                            {category.count !== undefined && (
                              <span className="ml-2 text-gray-500 text-xs">({category.count})</span>
                            )}
                            {category.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
                            )}
                          </div>
                          <svg className="h-4 w-4 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <nav className="flex-grow overflow-x-auto scrollbar-hide">
              <ul className="flex space-x-8 px-6">
                <li className="whitespace-nowrap">
                  <Link href="/" className="block py-3 text-sm font-medium hover:text-red-600 transition-colors">
                    <HomeIcon className="h-4 w-4 mr-1" />
                    Home
                  </Link>
                </li>
                <li className="whitespace-nowrap">
                  <Link href="/products" className="block py-3 text-sm font-medium hover:text-red-600 transition-colors">
                    <ShoppingBagIcon className="h-4 w-4 mr-1" />
                    Products
                  </Link>
                </li>
                <li className="whitespace-nowrap">
                  <Link href="/products/new-arrivals" className="block py-3 text-sm font-medium hover:text-red-600 transition-colors">
                    New Arrivals
                  </Link>
                </li>
                <li className="whitespace-nowrap">
                  <Link href="/products/best-sellers" className="block py-3 text-sm font-medium hover:text-red-600 transition-colors">
                    Best Sellers
                  </Link>
                </li>
                {/* {!loading && !error && categories.slice(0, 5).map((category) => (
                  <li key={category.id} className="whitespace-nowrap">
                    <Link 
                      href={getCategoryUrl(category.slug)}
                      className="block py-3 text-sm font-medium hover:text-red-600 transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))} */}
                <li className="whitespace-nowrap">
                  <Link href="/deals" className="block py-3 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                    Special Deals
                  </Link>
                </li>
              </ul>
            </nav>
            
            {/* Quick Links */}
            <div className="flex items-center space-x-6 ml-auto">
              <Link href="/help" className="text-sm font-medium hover:text-red-600 transition-colors flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </Link>
              <Link href="/contact" className="text-sm font-medium hover:text-red-600 transition-colors flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </Link>
              <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
                <Link href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Link>
                <Link href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </Link>
                <Link href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 
'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  CartIcon,
  HeartIcon,
  UserIcon,
  SearchIcon,
  MenuIcon,
  ChevronDownIcon
} from '../icons';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(3);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

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
            <Link href="/" className="flex items-center mr-8">
              <div className="relative">
                <div className="flex items-center">
                  <div className="rounded-full bg-[#D23F57] p-2 mr-2">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-gray-800">bazaar</span>
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-grow hidden md:block">
              <div className="flex w-full max-w-xl mx-auto">
                <div className="relative flex flex-grow">
                  <input
                    type="text"
                    placeholder="Searching for..."
                    className="w-full py-2 pl-4 pr-12 border border-gray-300 rounded-l-md focus:outline-none"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative">
                  <select className="h-full py-2 px-4 border-y border-r border-gray-300 bg-white text-gray-700 appearance-none rounded-r-md focus:outline-none">
                    <option>All Categories</option>
                    <option>Fashion</option>
                    <option>Electronics</option>
                    <option>Home & Garden</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <Link href="/account" className="text-gray-600 hover:text-[#D23F57] transition-colors">
                <UserIcon className="h-6 w-6" />
              </Link>
              <Link href="/wishlist" className="relative text-gray-600 hover:text-[#D23F57] transition-colors">
                <HeartIcon className="h-6 w-6" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#D23F57]">
                    {wishlistCount}
                  </Badge>
                )}
              </Link>
              <Link href="/cart" className="relative text-gray-600 hover:text-[#D23F57] transition-colors">
                <CartIcon className="h-6 w-6" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#D23F57]">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-600 ml-4"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            {/* Categories Menu */}
            <div className="relative">
              <button 
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                className="flex items-center gap-2 py-4 font-medium text-gray-700 hover:text-[#D23F57]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Categories</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {categoryMenuOpen && (
                <div className="absolute z-10 w-56 bg-white shadow-lg rounded-md border border-gray-200 mt-1">
                  <ul className="py-2">
                    <li>
                      <Link href="/category/fashion" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#D23F57]">
                        Fashion
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/electronics" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#D23F57]">
                        Electronics
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/home" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#D23F57]">
                        Home & Garden
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/beauty" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#D23F57]">
                        Beauty
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center">
              <Link href="/" className="block px-4 py-4 font-medium text-gray-700 hover:text-[#D23F57]">
                Home
              </Link>
              <Link href="/products" className="block px-4 py-4 font-medium text-gray-700 hover:text-[#D23F57]">
                Shop
              </Link>
              
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-4 font-medium text-gray-700 hover:text-[#D23F57]">
                  <span>Mega Menu</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-4 font-medium text-gray-700 hover:text-[#D23F57]">
                  <span>Full Screen Menu</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-4 font-medium text-gray-700 hover:text-[#D23F57]">
                  <span>Pages</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                <div className="absolute hidden group-hover:block bg-white shadow-lg w-48 z-10 mt-0 border border-gray-200 rounded-b-md">
                  <ul className="py-2">
                    <li>
                      <Link href="/about" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#D23F57]">
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#D23F57]">
                        Contact Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#D23F57]">
                        FAQ
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-4 font-medium text-gray-700 hover:text-[#D23F57]">
                  <span>User Account</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-4 font-medium text-gray-700 hover:text-[#D23F57]">
                  <span>Vendor Account</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4">
          <div className="container mx-auto px-4">
            {/* Mobile Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full py-2 pl-4 pr-10 border border-gray-300 rounded-md focus:outline-none"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <SearchIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                  className="flex items-center justify-between w-full py-2 font-medium text-gray-700"
                >
                  <span>Categories</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {categoryMenuOpen && (
                  <ul className="pl-4 mt-2 space-y-2">
                    <li>
                      <Link href="/category/fashion" className="block py-1 text-gray-600 hover:text-[#D23F57]">
                        Fashion
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/electronics" className="block py-1 text-gray-600 hover:text-[#D23F57]">
                        Electronics
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/home" className="block py-1 text-gray-600 hover:text-[#D23F57]">
                        Home & Garden
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/beauty" className="block py-1 text-gray-600 hover:text-[#D23F57]">
                        Beauty
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li>
                <Link href="/" className="block py-2 font-medium text-gray-700 hover:text-[#D23F57]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="block py-2 font-medium text-gray-700 hover:text-[#D23F57]">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="block py-2 font-medium text-gray-700 hover:text-[#D23F57]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="block py-2 font-medium text-gray-700 hover:text-[#D23F57]">
                  Contact
                </Link>
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <ul className="space-y-4">
                <li>
                  <Link href="/login" className="block py-2 text-gray-700 hover:text-[#D23F57]">
                    Login / Register
                  </Link>
                </li>
                <li>
                  <Link href="/track-orders" className="block py-2 text-gray-700 hover:text-[#D23F57]">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="block py-2 text-gray-700 hover:text-[#D23F57]">
                    My Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 
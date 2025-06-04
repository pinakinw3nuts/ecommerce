'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shopfinity</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your go-to destination for premium fashion, accessories and lifestyle products.
            </p>
            <div className="flex space-x-4 pt-2">
              <a 
                href="https://twitter.com" 
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="https://facebook.com" 
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Shopping */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shopping</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-sm text-muted-foreground hover:text-foreground">
                  Deals & Promotions
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="text-sm text-muted-foreground hover:text-foreground">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Account */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
                  Your Account
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
                  Orders History
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-sm text-muted-foreground hover:text-foreground">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-muted-foreground hover:text-foreground">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-muted-foreground hover:text-foreground">
                  Returns & Exchanges
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 dark:border-neutral-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Shopfinity. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 
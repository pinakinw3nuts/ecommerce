'use client';

import Link from 'next/link';
import { Linkedin, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Info */}
          <div>
            <div className="flex items-center mb-3">
              <span className="inline-block bg-primary text-white rounded-full p-2 mr-2">
                {/* Simple logo icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 15h8M9 9h.01M15 9h.01" /></svg>
              </span>
              <span className="text-xl font-bold text-gray-900">bazaar</span>
            </div>
            <p className="text-gray-600 text-sm max-w-xs">
              Bazaar is a modern e-commerce platform offering a wide range of products with fast delivery and exceptional customer service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-3 text-gray-700 text-sm">
              <li><Link href="/products" className="hover:text-primary transition-colors">Products</Link></li>
              <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
            <div className="flex space-x-5">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-500 hover:text-primary transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-500 hover:text-primary transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-500 hover:text-primary transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="my-8 border-t border-gray-200" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Bazaar. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 
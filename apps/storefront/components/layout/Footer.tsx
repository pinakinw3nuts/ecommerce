'use client';

import Link from 'next/link';
import { MailIcon, PhoneIcon, LocationIcon } from '../icons';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white mt-12">
      {/* Newsletter */}
      <div className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Subscribe to our newsletter</h3>
              <p className="text-gray-600">Get weekly updates about our latest products and special offers</p>
            </div>
            <div className="w-full md:w-auto flex-1 max-w-md">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button className="bg-primary text-white px-6 py-3 rounded-r-md font-medium hover:bg-primary/90 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Column 1 */}
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-primary text-white p-2 rounded-full mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-800">bazaar</span>
              </div>
              <p className="text-gray-600 mb-6">
                Bazaar is a modern e-commerce platform offering a wide range of products with 
                fast delivery and exceptional customer service.
              </p>
              <div className="flex items-center gap-4 text-gray-500">
                <a href="https://facebook.com" className="hover:text-primary transition-colors" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="https://twitter.com" className="hover:text-primary transition-colors" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a href="https://instagram.com" className="hover:text-primary transition-colors" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                </a>
                <a href="https://youtube.com" className="hover:text-primary transition-colors" aria-label="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                    <path d="m10 15 5-3-5-3z"></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="font-bold text-lg mb-5 text-gray-900">Customer Care</h4>
              <ul className="space-y-4 text-gray-600">
                <li>
                  <Link href="/help-center" className="hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="hover:text-primary transition-colors">
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-primary transition-colors">
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-primary transition-colors">
                    Shipping & Delivery
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="font-bold text-lg mb-5 text-gray-900">Quick Links</h4>
              <ul className="space-y-4 text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap" className="hover:text-primary transition-colors">
                    Sitemap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="font-bold text-lg mb-5 text-gray-900">Contact</h4>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-3">
                  <LocationIcon className="h-5 w-5 mt-0.5 text-gray-500" />
                  <span>123 Main Street, Anytown, USA 12345</span>
                </li>
                <li className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-500" />
                  <a href="tel:+1-800-123-4567" className="hover:text-primary transition-colors">
                    +1 (800) 123-4567
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MailIcon className="h-5 w-5 text-gray-500" />
                  <a href="mailto:support@bazaar.com" className="hover:text-primary transition-colors">
                    support@bazaar.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © {currentYear} Bazaar. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <img src="/images/payment/visa.svg" alt="Visa" className="h-8" />
            <img src="/images/payment/mastercard.svg" alt="Mastercard" className="h-8" />
            <img src="/images/payment/paypal.svg" alt="PayPal" className="h-8" />
            <img src="/images/payment/amex.svg" alt="American Express" className="h-8" />
          </div>
        </div>
      </div>
    </footer>
  );
} 
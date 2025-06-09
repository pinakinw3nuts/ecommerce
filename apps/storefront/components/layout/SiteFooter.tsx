'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';

export default function SiteFooter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log('Newsletter signup:', email);
    setEmail('');
    // Add actual implementation
  };

  return (
    <footer className="bg-gray-100 text-gray-800">
      {/* Features Section */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center">
            <div className="bg-red-500 rounded-full p-4 mr-4">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold uppercase">FREE INDIA DELIVERY</h3>
              <p className="text-sm">Free delivery for all Indian customers</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-red-500 rounded-full p-4 mr-4">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold uppercase">SECURE PAYMENT</h3>
              <p className="text-sm">We accept Visa, American Express, Paypal, Mastercard</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-red-500 rounded-full p-4 mr-4">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold uppercase">HIGH QUALITY</h3>
              <p className="text-sm">All of our products are made with care and covered for one year</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Newsletter Section */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">NEWSLETTER SIGN UP</h2>
          <p className="mb-6">Receive our latest updates about our products and promotions.</p>
          
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow border border-gray-300 px-4 py-2 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="bg-red-500 text-white px-8 py-2 font-medium hover:bg-red-600"
            >
              SUBMIT
            </button>
          </form>
        </div>
      </div>
      
      {/* Links Section */}
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">QUICK LINKS</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-red-500">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-red-500">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-red-500">Terms Of Service</Link></li>
              <li><Link href="/refund" className="hover:text-red-500">Refund Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-red-500">Privacy Policy</Link></li>
              <li><Link href="/shipping" className="hover:text-red-500">Shipping</Link></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4">CATEGORIES</h3>
            <ul className="space-y-2">
              <li><Link href="/products?brand=audi" className="hover:text-red-500">Audi</Link></li>
              <li><Link href="/products?brand=porsche" className="hover:text-red-500">Porsche</Link></li>
              <li><Link href="/products?brand=skoda" className="hover:text-red-500">Skoda</Link></li>
              <li><Link href="/products?brand=volkswagen" className="hover:text-red-500">Volkswagen</Link></li>
              <li><Link href="/products?brand=bmw" className="hover:text-red-500">BMW</Link></li>
              <li><Link href="/products?brand=mini" className="hover:text-red-500">Mini Cooper</Link></li>
              <li><Link href="/products?brand=mercedes" className="hover:text-red-500">Mercedes</Link></li>
              <li><Link href="/products?brand=land-rover" className="hover:text-red-500">Land Rover</Link></li>
            </ul>
          </div>
          
          {/* Contact Us */}
          <div>
            <h3 className="font-bold text-lg mb-4">CONTACT US</h3>
            <ul className="space-y-4">
              <li className="flex">
                <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p>A to Z Auto Parts</p>
                  <p>Santi Sadan Estate, Opp Din Bhai Tower,</p>
                  <p>Mirzapur Rd, Ahmedabad - 380001, Gujarat, India.</p>
                </div>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <p>+91 9023149040</p>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <p>sales@atozautopartsindia.com</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="bg-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} A to Z Auto Parts. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 
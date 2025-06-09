"use client";

import Link from 'next/link';

const aftermarketBrands = [
  { name: 'APR', href: '/shop?brand=apr' },
  { name: 'Dinan', href: '/shop?brand=dinan' },
  { name: 'Eisenmann', href: '/shop?brand=eisenmann' },
  { name: 'H&R', href: '/shop?brand=hr' },
  { name: 'Milltek', href: '/shop?brand=milltek' }
];

export default function AftermarketBrands() {
  return (
    <section className="py-6 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-center mb-4">SHOP BY AFTERMARKET BRAND</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {aftermarketBrands.map((brand) => (
            <Link 
              key={brand.name}
              href={brand.href}
              className="flex items-center justify-center"
            >
              <div className="text-sm text-gray-800">
                {brand.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 
"use client";

import Link from 'next/link';
import Image from 'next/image';

const brands = [
  { name: 'BMW', href: '/shop?brand=bmw', logo: '/images/brands/bmw.png' },
  { name: 'Audi', href: '/shop?brand=audi', logo: '/images/brands/audi.png' },
  { name: 'Benz', href: '/shop?brand=benz', logo: '/images/brands/benz.png' },
  { name: 'Jaguar', href: '/shop?brand=jaguar', logo: '/images/brands/jaguar.png' },
  { name: 'LR', href: '/shop?brand=lr', logo: '/images/brands/lr.png' },
  { name: 'Mini', href: '/shop?brand=mini', logo: '/images/brands/mini.png' },
];

export default function BrandLogos() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">SHOP BY POPULAR BRANDS</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {brands.map((brand) => (
            <Link 
              key={brand.name}
              href={brand.href}
              className="flex flex-col items-center justify-center border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
            >
              <div className="w-24 h-24 relative flex items-center justify-center">
                <div className="w-full h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${brand.logo})` }}></div>
              </div>
              <div className="mt-2 text-lg font-medium">
                {brand.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 
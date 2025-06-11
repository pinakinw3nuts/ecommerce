"use client";

import Image from 'next/image';
import Link from 'next/link';

const banners = [
  {
    id: 1,
    title: 'PREMIUM OEM PARTS',
    description: 'Genuine manufacturer parts with warranty',
    image: '/images/banners/oem-parts.jpg',
    href: '/shop/oem-parts',
    buttonText: 'Shop Now'
  },
  {
    id: 2,
    title: 'PERFORMANCE UPGRADES',
    description: 'Enhance your vehicle\'s performance',
    image: '/images/banners/performance.jpg',
    href: '/shop/performance',
    buttonText: 'Explore'
  },
  {
    id: 3,
    title: 'SUMMER SALE',
    description: 'Up to 30% off on select items',
    image: '/images/banners/summer-sale.jpg',
    href: '/sale',
    buttonText: 'View Deals'
  }
];

export default function FeaturedBanners() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src={banner.image}
                alt={banner.title || 'Featured banner'}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-xl font-bold mb-1">{banner.title}</h3>
                <p className="text-gray-200 mb-4">{banner.description}</p>
                <Link 
                  href={banner.href}
                  className="inline-block bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors w-fit"
                >
                  {banner.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
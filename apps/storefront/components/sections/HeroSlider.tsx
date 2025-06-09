'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define slider items
const sliderItems = [
  {
    id: 1,
    title: 'ALL TYPES OF WIDE',
    subtitle: 'RANGE OF SPARE PARTS',
    description: 'Explore a Diverse Selection of Quality Automotive Components.',
    buttonText: 'SHOP NOW',
    buttonLink: '/shop',
    bgColor: 'bg-gray-900',
  },
  {
    id: 2,
    title: 'PREMIUM QUALITY',
    subtitle: 'AUTO PARTS & ACCESSORIES',
    description: 'Find the Perfect Parts for Your Vehicle with Our Expert Selection.',
    buttonText: 'SHOP NOW',
    buttonLink: '/shop',
    bgColor: 'bg-gray-800',
  },
  {
    id: 3,
    title: 'EXCLUSIVE DEALS',
    subtitle: 'ON PERFORMANCE PARTS',
    description: 'Upgrade Your Vehicle with Our Special Offers on Premium Components.',
    buttonText: 'VIEW OFFERS',
    buttonLink: '/shop/deals',
    bgColor: 'bg-black',
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle manual navigation
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };
  
  return (
    <section className="relative w-full h-[500px] overflow-hidden">
      {/* Slider items */}
      {sliderItems.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          } ${item.bgColor}`}
        >
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2">{item.title}</h1>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{item.subtitle}</h2>
            <p className="max-w-2xl mb-8 text-lg">{item.description}</p>
            <Link
              href={item.buttonLink}
              className="inline-flex items-center border border-white px-8 py-3 text-lg font-medium hover:bg-white hover:text-black transition-colors"
            >
              {item.buttonText} 
              <svg 
                className="ml-2 h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      ))}
      
      {/* Slide indicators */}
      <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center space-x-3">
        {sliderItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full ${
              index === currentSlide ? 'bg-teal-400' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
} 
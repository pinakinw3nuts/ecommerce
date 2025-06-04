'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#F5F5F5]">
      {/* Main Hero Banner */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Section - Hero Content */}
          <div className="w-full lg:w-3/4 flex flex-col lg:flex-row">
            {/* Text Content */}
            <div className="w-full lg:w-1/2 mb-8 lg:mb-0 pr-0 lg:pr-8 flex flex-col justify-center">
              <div className="max-w-xl">
                <h2 className="text-xl font-medium text-gray-700 mb-2">
                  LIFESTYLE COLLECTION
                </h2>
                <h1 className="text-5xl md:text-7xl font-bold text-[#2B3445] mb-4">
                  MEN
                </h1>
                <div className="mb-6">
                  <h3 className="text-2xl md:text-3xl font-medium text-gray-800 mb-1">
                    SALE UP TO <span className="text-[#E94560]">30% OFF</span>
                  </h3>
                  <p className="text-gray-600">
                    Get Free Shipping on orders over $99.00
                  </p>
                </div>
                
                <Link href="/products/all">
                  <button
                    aria-label="Shop now"
                    className="px-6 py-3 bg-[#2B3445] text-white font-medium rounded-md hover:bg-[#1e2939] transition-all duration-300"
                  >
                    Shop Now
                  </button>
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="w-full lg:w-1/2 relative flex items-center justify-center">
              <Image 
                src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80" 
                alt="Men's fashion model wearing a leather jacket"
                width={400}
                height={500}
                priority
                className="object-contain"
              />
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <button className="w-2 h-2 rounded-full bg-[#2B3445]"></button>
              <button className="w-2 h-2 rounded-full bg-gray-300"></button>
            </div>
          </div>

          {/* Right Section - Promotional Cards */}
          <div className="w-full lg:w-1/4 flex flex-col gap-6">
            {/* Summer Sale Card */}
            <div className="bg-[#F5F5F5] rounded-md overflow-hidden shadow-sm relative h-[160px]">
              <div className="p-6 flex flex-col h-full justify-center">
                <div>
                  <p className="text-sm font-medium text-[#2B3445] mb-1">NEW ARRIVALS</p>
                  <h3 className="text-xl font-bold text-[#2B3445] mb-0">SUMMER</h3>
                  <h4 className="text-xl font-bold text-[#2B3445] mb-3">SALE 20% OFF</h4>
                  <Link href="/products/sale" className="inline-flex items-center text-[#2B3445] font-medium">
                    Shop Now
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/2">
                <Image
                  src="/images/shoes.jpg"
                  alt="Summer sale shoes"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Gaming Card */}
            <div className="bg-[#F5F5F5] rounded-md overflow-hidden shadow-sm relative h-[160px]">
              <div className="p-6 flex flex-col h-full justify-center">
                <div>
                  <p className="text-sm font-medium text-[#2B3445] mb-1">GAMING 4K</p>
                  <h3 className="text-xl font-bold text-[#2B3445] mb-0">DESKTOPS &</h3>
                  <h4 className="text-xl font-bold text-[#2B3445] mb-3">LAPTOPS</h4>
                  <Link href="/products/electronics" className="inline-flex items-center text-[#2B3445] font-medium">
                    Shop Now
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/2">
                <Image
                  src="/images/computer.jpg"
                  alt="Gaming computers"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Free Shipping and Benefits Section */}
      <div className="container mx-auto px-4 py-8 mt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center">
            <div className="mr-4 text-[#2B3445]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 19C8.5 20.1046 7.60457 21 6.5 21C5.39543 21 4.5 20.1046 4.5 19C4.5 17.8954 5.39543 17 6.5 17C7.60457 17 8.5 17.8954 8.5 19Z" fill="currentColor"/>
                <path d="M17.5 19C17.5 20.1046 16.6046 21 15.5 21C14.3954 21 13.5 20.1046 13.5 19C13.5 17.8954 14.3954 17 15.5 17C16.6046 17 17.5 17.8954 17.5 19Z" fill="currentColor"/>
                <path d="M3.5 4H5.5L7.5 17H16.5L18.5 8H10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[#2B3445]">Fast Delivery</h3>
              <p className="text-sm text-gray-500">Start from $10</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 text-[#2B3445]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[#2B3445]">Money Guarantee</h3>
              <p className="text-sm text-gray-500">7 Days Back</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 text-[#2B3445]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M7.5 12L10.5 15L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[#2B3445]">365 Days</h3>
              <p className="text-sm text-gray-500">For free return</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 text-[#2B3445]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C20.5523 4 21 4.44772 21 5V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V5C3 4.44772 3.44772 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[#2B3445]">Payment</h3>
              <p className="text-sm text-gray-500">Secure system</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
'use client';

import { Button } from '@components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ShoppingBagIcon } from '@components/icons';

export default function Hero() {
  return (
    <section className="py-12 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 max-w-[1440px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span 
              className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              New Collection 2024
            </motion.span>
            
            <motion.h1 
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Elevate Your Style With Our Premium Collection
            </motion.h1>
            
            <motion.p 
              className="text-gray-500 text-lg max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Discover curated products that blend quality, innovation, and style for your everyday needs.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4 pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button size="lg" asChild>
                <Link href="/products" className="group">
                  <ShoppingBagIcon className="mr-2 h-4 w-4" />
                  Shop Now 
                  <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                    <span className="text-xs font-medium">★</span>
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                <span className="font-semibold">500+</span> happy customers
              </span>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="relative h-[300px] md:h-[400px] lg:h-[500px] flex justify-center md:justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute right-0 bottom-0 w-[280px] h-[280px] md:w-[380px] md:h-[380px] bg-primary/10 rounded-full -mr-20 -mb-20 z-0"></div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative z-10"
            >
              <Image
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff"
                alt="Premium Product"
                width={500}
                height={500}
                className="object-contain hover:scale-105 transition-transform duration-500"
                priority
              />
              <div className="absolute top-5 right-5 bg-white rounded-full p-3 shadow-lg">
                <span className="text-lg font-bold text-primary">-20%</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 
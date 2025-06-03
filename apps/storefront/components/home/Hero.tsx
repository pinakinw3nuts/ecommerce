'use client';

import { Button } from '@components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@components/icons';

export default function Hero() {
  return (
    <section className="py-12 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 max-w-[1440px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight">
              Elevate Your Style With Our Premium Collection
            </h1>
            <p className="text-gray-500 text-lg max-w-md">
              Discover curated products that blend quality, innovation, and style for your everyday needs.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button size="lg" asChild>
                <Link href="/products">
                  Shop Now <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            className="relative h-[300px] md:h-[400px] lg:h-[500px] flex justify-center md:justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute right-0 bottom-0 w-[280px] h-[280px] md:w-[380px] md:h-[380px] bg-primary/10 rounded-full -mr-20 -mb-20 z-0"></div>
            <Image
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff"
              alt="Premium Product"
              width={500}
              height={500}
              className="object-contain z-10 hover:scale-105 transition-transform duration-500"
              priority
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
} 
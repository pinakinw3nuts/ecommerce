'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import Link from 'next/link';

type CountdownTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export default function DealsBanner() {
  // Set end date to 7 days from now for the countdown
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 3,
    hours: 12,
    minutes: 0,
    seconds: 0
  });

  // Update countdown timer
  useEffect(() => {
    // Set end date to 3 days and 12 hours from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(endDate.getHours() + 12);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(timer);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full py-12 md:py-16 lg:py-20 px-4 md:px-8">
      <motion.div 
        className="relative max-w-7xl mx-auto overflow-hidden rounded-xl group"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Background Image */}
        <motion.div 
          className="absolute inset-0 w-full h-[400px]"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div 
            className="w-full h-full bg-cover bg-center transition-all duration-700 group-hover:brightness-110"
            style={{ backgroundImage: 'url(https://source.unsplash.com/featured/?sale)' }}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 bg-black/50"></div>
        </motion.div>

        {/* Content */}
        <div className="relative h-[400px] w-full flex items-center justify-center">
          <motion.div 
            className="text-center px-6 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-4xl md:text-5xl text-white font-bold leading-tight mb-4">
              Save up to 30% This Week Only
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-6">
              Don't miss out on limited-time offers
            </p>
            
            {/* Countdown Timer */}
            <div className="flex justify-center gap-4 mb-8">
              {[
                { value: countdown.days, label: 'Days' },
                { value: countdown.hours, label: 'Hours' },
                { value: countdown.minutes, label: 'Min' },
                { value: countdown.seconds, label: 'Sec' }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-2xl md:text-3xl font-bold text-white">
                    {item.value.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs uppercase text-white/70">{item.label}</span>
                </div>
              ))}
            </div>
            
            <Link href="/products?sale=true">
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-medium px-8 py-6 h-auto"
                aria-label="View all sale items and special deals"
              >
                Shop Deals
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
} 
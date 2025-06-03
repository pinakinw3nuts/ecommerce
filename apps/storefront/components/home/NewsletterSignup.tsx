'use client';

import { useState } from 'react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon } from '@components/icons';

// Define the form schema with zod
const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export default function NewsletterSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: NewsletterFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Newsletter subscription:', data);
      
      setIsSuccess(true);
      reset();
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-background border-t border-border" aria-labelledby="newsletter-heading">
      <div className="container mx-auto px-4 max-w-[1440px]">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 
              id="newsletter-heading" 
              className="text-2xl md:text-3xl font-bold mb-3"
            >
              Get Exclusive Offers
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Sign up to receive the latest updates, product launches, and exclusive deals.
            </p>
          </motion.div>

          <motion.div
            className="bg-white border border-border rounded-lg shadow-sm p-6 md:p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isSuccess ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Thank You for Subscribing!</h3>
                <p className="text-gray-500">
                  You're now on our list to receive the latest updates and exclusive offers.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <MailIcon className="h-5 w-5" />
                    </div>
                    <motion.div
                      whileTap={{ scale: 0.99 }}
                      className="w-full"
                    >
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        {...register('email')}
                        aria-invalid={errors.email ? 'true' : 'false'}
                      />
                    </motion.div>
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
} 
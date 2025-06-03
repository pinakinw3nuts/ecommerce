'use client';

import { Card } from '@components/ui/Card';
import { motion } from 'framer-motion';
import { ShoppingBagIcon, ShieldIcon, ClockIcon, RefreshIcon } from '@components/icons';

type FeatureItem = {
  icon: JSX.Element;
  title: string;
  description: string;
};

const features: FeatureItem[] = [
  {
    icon: <ShoppingBagIcon className="h-10 w-10" />,
    title: 'Free Shipping',
    description: 'Free shipping on all orders over $50 with no minimum purchase required.',
  },
  {
    icon: <ShieldIcon className="h-10 w-10" />,
    title: 'Secure Payments',
    description: 'All transactions are secured with industry-leading encryption technology.',
  },
  {
    icon: <ClockIcon className="h-10 w-10" />,
    title: '24/7 Support',
    description: 'Our customer service team is available around the clock to assist you.',
  },
  {
    icon: <RefreshIcon className="h-10 w-10" />,
    title: 'Easy Returns',
    description: 'Hassle-free returns within 30 days of purchase for a full refund.',
  },
];

export default function Features() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-12 md:py-20" aria-labelledby="features-heading">
      <div className="container mx-auto px-4 max-w-[1440px]">
        <div className="text-center mb-12">
          <h2 
            id="features-heading" 
            className="text-2xl md:text-3xl font-bold mb-3"
          >
            Why Shop With Us?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We go the extra mile to deliver world-class shopping experience.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-medium text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 
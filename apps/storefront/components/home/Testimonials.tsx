'use client';

import { Card } from '@components/ui/Card';
import { motion } from 'framer-motion';
import Image from 'next/image';

type Testimonial = {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Fashion Blogger',
    company: 'Style Daily',
    content: 'The quality of products exceeded my expectations! Fast shipping and excellent customer service. I\'ve recommended this store to all my followers.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Product Designer',
    company: 'Designify',
    content: 'As a designer, I appreciate attention to detail. This store delivers on every front - from the website experience to the packaging. Truly impressive!',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Loyal Customer',
    company: '',
    content: 'I\'ve been shopping here for years and have never been disappointed. The return process is hassle-free and their support team is always helpful.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 4,
    name: 'David Wilson',
    role: 'Tech Enthusiast',
    company: 'TechReviews',
    content: 'The checkout process is seamless and the shipping updates are frequent. I appreciate the transparency and reliability of this store.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="p-6 flex flex-col h-full">
        <div className="mb-4">
          <svg 
            className="h-8 w-8 text-primary/40" 
            fill="currentColor" 
            viewBox="0 0 32 32" 
            aria-hidden="true"
          >
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
        </div>
        <p className="text-gray-600 flex-grow mb-6">{testimonial.content}</p>
        <div className="flex items-center mt-auto">
          <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
            <Image 
              src={testimonial.avatar} 
              alt={testimonial.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-sm">{testimonial.name}</p>
            <p className="text-gray-500 text-xs">
              {testimonial.role}
              {testimonial.company && (
                <>, <span className="text-primary">{testimonial.company}</span></>
              )}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function Testimonials() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
      }
    },
  };

  return (
    <section className="py-16 md:py-20" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4 max-w-[1440px]">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 
            id="testimonials-heading" 
            className="text-2xl md:text-3xl font-bold mb-3"
          >
            What Our Customers Say
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Don't just take our word for it — hear from our satisfied customers around the world.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.id} variants={item}>
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 
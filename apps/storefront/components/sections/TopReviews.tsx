"use client";

import { useState } from 'react';
import { StarIcon } from '../icons';

const reviews = [
  {
    id: '1',
    customerName: 'John Smith',
    rating: 5,
    title: 'BMW Repair Guide',
    comment: 'Perfect fit for my 335i. Installation was straightforward and the performance improvement is noticeable. Would definitely recommend to other BMW owners.',
    date: '2 weeks ago',
    verified: true
  },
  {
    id: '2',
    customerName: 'Sarah Parker',
    rating: 4,
    title: 'Mercedes Brake Pads',
    comment: 'Great quality brake pads for my C-Class. They work better than the OEM ones and were half the price. Shipping was fast too.',
    date: '1 month ago',
    verified: true
  },
  {
    id: '3',
    customerName: 'Michael Johnson',
    rating: 5,
    title: 'Audi Suspension Kit',
    comment: 'Excellent suspension kit for my S4. The ride quality has improved significantly. Installation required professional help but was worth it.',
    date: '3 weeks ago',
    verified: true
  }
];

export default function TopReviews() {
  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold mb-4">TOP REVIEWS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{review.customerName}</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon 
                        key={i}
                        className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500">{review.date}</div>
              </div>
              
              <h3 className="font-medium text-sm mb-1">{review.title}</h3>
              <p className="text-xs text-gray-600 line-clamp-3">{review.comment}</p>
              
              {review.verified && (
                <div className="mt-2 text-xs text-green-600">Verified Purchase</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
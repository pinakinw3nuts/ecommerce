'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDownIcon } from '../icons';

type CategoryType = {
  id: string;
  name: string;
  slug: string;
  count: number;
  children?: CategoryType[];
};

// Sample data - in a real app, this would come from an API
const categories: CategoryType[] = [
  {
    id: '1',
    name: 'Fashion',
    slug: 'fashion',
    count: 125,
    children: [
      { id: '1-1', name: 'Men', slug: 'men', count: 45 },
      { id: '1-2', name: 'Women', slug: 'women', count: 80 },
    ],
  },
  {
    id: '2',
    name: 'Electronics',
    slug: 'electronics',
    count: 95,
    children: [
      { id: '2-1', name: 'Phones', slug: 'phones', count: 35 },
      { id: '2-2', name: 'Laptops', slug: 'laptops', count: 25 },
      { id: '2-3', name: 'Accessories', slug: 'accessories', count: 35 },
    ],
  },
  { id: '3', name: 'Home & Garden', slug: 'home-garden', count: 65 },
  { id: '4', name: 'Beauty', slug: 'beauty', count: 53 },
  { id: '5', name: 'Sports', slug: 'sports', count: 42 },
];

const priceRanges = [
  { id: 'p1', label: '$0-$50', value: '0-50' },
  { id: 'p2', label: '$50-$100', value: '50-100' },
  { id: 'p3', label: '$100-$200', value: '100-200' },
  { id: 'p4', label: '$200-$500', value: '200-500' },
  { id: 'p5', label: '$500+', value: '500-' },
];

const ratings = [
  { id: 'r5', label: '5 Stars', value: 5 },
  { id: 'r4', label: '4 Stars & Up', value: 4 },
  { id: 'r3', label: '3 Stars & Up', value: 3 },
  { id: 'r2', label: '2 Stars & Up', value: 2 },
  { id: 'r1', label: '1 Star & Up', value: 1 },
];

const CategoryItem = ({ category, level = 0 }: { category: CategoryType; level?: number }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="mb-1">
      <div className="flex items-center justify-between py-2">
        <Link
          href={`/category/${category.slug}`}
          className={`hover:text-primary transition-colors ${
            level > 0 ? 'pl-4 text-sm text-gray-600' : 'font-medium text-gray-800'
          }`}
        >
          {category.name}
          <span className="text-gray-500 text-sm ml-1">({category.count})</span>
        </Link>
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:text-primary transition-colors text-gray-400"
          >
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? 'transform rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="mt-1 ml-3 border-l pl-2 border-gray-200">
          {category.children!.map((child) => (
            <CategoryItem key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Categories</h3>
        <div className="divide-y divide-gray-100">
          {categories.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Price Range</h3>
        <div className="space-y-3">
          {priceRanges.map((range) => (
            <div key={range.id} className="flex items-center">
              <input
                type="checkbox"
                id={range.id}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor={range.id} className="ml-2 text-gray-700 cursor-pointer">
                {range.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Ratings */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Ratings</h3>
        <div className="space-y-3">
          {ratings.map((rating) => (
            <div key={rating.id} className="flex items-center">
              <input
                type="checkbox"
                id={rating.id}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor={rating.id} className="ml-2 text-gray-700 flex items-center cursor-pointer">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-lg ${i < rating.value ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
                {rating.value < 5 && <span className="ml-1 text-sm text-gray-500">& Up</span>}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      <button className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-md font-medium transition-colors shadow-sm">
        Clear All Filters
      </button>
    </div>
  );
} 
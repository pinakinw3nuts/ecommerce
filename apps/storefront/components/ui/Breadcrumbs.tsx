'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li 
              key={index} 
              className="flex items-center"
            >
              {index === 0 ? (
                // First item with home icon
                <Link 
                  href={item.href}
                  className="text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <Home className="w-3.5 h-3.5 mr-1" />
                  <span className="sr-only sm:not-sr-only">{item.label}</span>
                </Link>
              ) : (
                // Normal item
                <Link 
                  href={item.href}
                  className={`
                    ${isLast 
                      ? 'text-gray-900 font-medium pointer-events-none' 
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )}
              
              {/* Separator */}
              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5 mx-2 text-gray-400 flex-shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
} 
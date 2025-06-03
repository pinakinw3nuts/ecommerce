'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import { ChevronDownIcon } from '../icons';

type PageContainerProps = {
  children: ReactNode;
  showSidebar?: boolean;
  title?: string;
  breadcrumbs?: { label: string; href: string }[];
  className?: string;
};

export default function PageContainer({
  children,
  showSidebar = false,
  title,
  breadcrumbs,
  className = '',
}: PageContainerProps) {
  return (
    <div className={`bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-5">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center">
                <li className="inline-flex items-center">
                  <Link href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mx-2 text-gray-400">/</span>
                    {index === breadcrumbs.length - 1 ? (
                      <span className="text-sm font-medium text-gray-800">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-sm text-gray-500 hover:text-primary transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        )}

        {/* Title */}
        {title && (
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {showSidebar && (
              <button className="md:hidden flex items-center gap-1 text-sm font-medium text-gray-600 border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                <span>Filter</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          {showSidebar && (
            <div className="md:w-1/4 md:block hidden">
              <Sidebar />
            </div>
          )}

          {/* Main Content */}
          <div className={showSidebar ? 'md:w-3/4' : 'w-full'}>
            {children}
          </div>
        </div>

        {/* Mobile Filter Sidebar */}
        {showSidebar && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-top border-t border-gray-200 p-4">
            <button className="w-full bg-primary text-white py-3 rounded-md font-medium">
              Filter & Sort
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
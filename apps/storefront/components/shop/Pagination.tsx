'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(1);
    
    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // If we're at the start, show more pages after
    if (currentPage <= 2) {
      endPage = Math.min(totalPages - 1, 4);
    }
    
    // If we're at the end, show more pages before
    if (currentPage >= totalPages - 1) {
      startPage = Math.max(2, totalPages - 3);
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      items.push('ellipsis-start');
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      items.push('ellipsis-end');
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    return items;
  };
  
  // Handle page click
  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };
  
  // Handle previous page
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  // Handle next page
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  // If there's only one page, don't show pagination
  if (totalPages <= 1) {
    return null;
  }
  
  const paginationItems = generatePaginationItems();
  
  return (
    <nav className="flex justify-center">
      <ul className="flex items-center">
        {/* Previous button */}
        <li>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`
              flex items-center justify-center h-9 w-9 rounded-md
              ${currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'}
            `}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
        </li>
        
        {/* Page numbers */}
        {paginationItems.map((item, index) => {
          // Render ellipsis
          if (item === 'ellipsis-start' || item === 'ellipsis-end') {
            return (
              <li key={`ellipsis-${index}`}>
                <span className="flex items-center justify-center h-9 w-9 text-gray-500">
                  &hellip;
                </span>
              </li>
            );
          }
          
          // Render page number
          return (
            <li key={`page-${item}`}>
              <button
                onClick={() => handlePageClick(item as number)}
                className={`
                  flex items-center justify-center h-9 w-9 rounded-md
                  ${item === currentPage
                    ? 'bg-red-600 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
              >
                {item}
              </button>
            </li>
          );
        })}
        
        {/* Next button */}
        <li>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`
              flex items-center justify-center h-9 w-9 rounded-md
              ${currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'}
            `}
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </li>
      </ul>
    </nav>
  );
} 
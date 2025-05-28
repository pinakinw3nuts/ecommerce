import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Debug logging for pagination props
  useEffect(() => {
    console.log('Pagination component props:', {
      currentPage,
      pageSize,
      totalItems,
      calculatedTotalPages: totalPages
    });
  }, [currentPage, pageSize, totalItems, totalPages]);
  
  const handlePageChange = (page: number) => {
    console.log(`Pagination: changing from page ${currentPage} to ${page}`);
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7; // Show max 7 page numbers including first, last, and ellipsis
    
    if (totalPages <= maxPagesToShow) {
      // If total pages are less than max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Don't render pagination if there are no pages
  if (totalPages <= 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm"
      >
        First
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      {getPageNumbers().map((pageNumber, index) => (
        pageNumber === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
        ) : (
          <button
            key={pageNumber}
            onClick={() => handlePageChange(pageNumber as number)}
            disabled={pageNumber === currentPage}
            className={`min-w-[32px] rounded px-2 py-1 text-sm ${
              pageNumber === currentPage
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {pageNumber}
          </button>
        )
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-3 py-2 text-sm"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-3 py-2 text-sm"
      >
        Last
      </Button>
    </div>
  );
} 
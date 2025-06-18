'use client';

import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <div className="flex justify-center my-8">
      <div className="flex items-center space-x-1">
        <Button 
          variant="outline" 
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        
        {/* First page */}
        {currentPage > 2 && (
          <Button 
            variant="outline"
            className={currentPage === 1 ? "bg-blue-600 text-white border-blue-600" : ""}
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
        )}
        
        {/* Ellipsis */}
        {currentPage > 3 && (
          <span className="px-2">...</span>
        )}
        
        {/* Previous page */}
        {currentPage > 1 && (
          <Button 
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
          >
            {currentPage - 1}
          </Button>
        )}
        
        {/* Current page */}
        <Button 
          variant="outline" 
          className="bg-blue-600 text-white border-blue-600"
        >
          {currentPage}
        </Button>
        
        {/* Next page */}
        {currentPage < totalPages && (
          <Button 
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
          >
            {currentPage + 1}
          </Button>
        )}
        
        {/* Ellipsis */}
        {currentPage < totalPages - 2 && (
          <span className="px-2">...</span>
        )}
        
        {/* Last page */}
        {currentPage < totalPages - 1 && totalPages > 1 && (
          <Button 
            variant="outline"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        )}
        
        <Button 
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
} 
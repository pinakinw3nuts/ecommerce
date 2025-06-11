'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Specification {
  name: string;
  value: string;
}

interface ProductSpecificationsProps {
  specifications: Specification[];
  showAll?: boolean;
}

export default function ProductSpecifications({ 
  specifications, 
  showAll = false 
}: ProductSpecificationsProps) {
  const [isExpanded, setIsExpanded] = useState(showAll);
  
  if (!specifications || specifications.length === 0) {
    return null;
  }
  
  // Display only first 4 specs when collapsed
  const displaySpecs = isExpanded ? specifications : specifications.slice(0, 4);
  const hasMoreSpecs = specifications.length > 4;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <h3 className="font-medium text-lg p-4 bg-gray-50 border-b border-gray-200">
        Product Specifications
      </h3>
      
      <div className="divide-y divide-gray-200">
        {displaySpecs.map((spec, index) => (
          <div 
            key={index} 
            className="grid grid-cols-3 p-3 text-sm even:bg-gray-50"
          >
            <div className="font-medium text-gray-700">{spec.name}</div>
            <div className="col-span-2 text-gray-600">{spec.value}</div>
          </div>
        ))}
      </div>
      
      {hasMoreSpecs && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1 border-t border-gray-200"
        >
          {isExpanded ? (
            <>
              <span>Show Less</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Show All Specifications</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
} 